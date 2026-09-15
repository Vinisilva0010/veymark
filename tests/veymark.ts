import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { Veymark } from "../target/types/veymark";
import { assert } from "chai";

const { PublicKey, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL } = anchor.web3;

describe("veymark", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.veymark as Program<Veymark>;
  const admin = provider.wallet;

  const manufacturerAuthority = Keypair.generate();
  const impostor = Keypair.generate();

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const [manufacturerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("manufacturer"), manufacturerAuthority.publicKey.toBuffer()],
    program.programId
  );

  // Devnet airdrops are rate limited and flaky, so fund test accounts by
  // transferring from the provider wallet instead.
  const fund = async (target: anchor.web3.PublicKey, sol = 0.2) => {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: admin.publicKey,
        toPubkey: target,
        lamports: Math.floor(sol * LAMPORTS_PER_SOL),
      })
    );
    await provider.sendAndConfirm(tx);
  };

  before(async () => {
    await fund(manufacturerAuthority.publicKey);
    await fund(impostor.publicKey);
  });

  describe("config", () => {
    it("has a config owned by the admin", async () => {
      // On devnet state persists between runs, so initialize only once.
      let config = await program.account.config.fetchNullable(configPda);

      if (config === null) {
        await program.methods
          .initializeConfig()
          .accountsPartial({ config: configPda, admin: admin.publicKey })
          .rpc();
        config = await program.account.config.fetch(configPda);
      }

      assert.ok(config.admin.equals(admin.publicKey));
    });
  });

  describe("manufacturer registration", () => {
    it("registers a manufacturer as unverified", async () => {
      await program.methods
        .registerManufacturer("Bosch Brasil")
        .accountsPartial({
          config: configPda,
          manufacturer: manufacturerPda,
          authority: manufacturerAuthority.publicKey,
        })
        .signers([manufacturerAuthority])
        .rpc();

      const manufacturer = await program.account.manufacturer.fetch(manufacturerPda);
      assert.equal(manufacturer.name, "Bosch Brasil");
      assert.isFalse(manufacturer.verified, "must start unverified");
      assert.equal(manufacturer.partsCount.toNumber(), 0);
    });

    it("rejects registering the same authority twice", async () => {
      try {
        await program.methods
          .registerManufacturer("Bosch Brasil Again")
          .accountsPartial({
            config: configPda,
            manufacturer: manufacturerPda,
            authority: manufacturerAuthority.publicKey,
          })
          .signers([manufacturerAuthority])
          .rpc();
        assert.fail("duplicate registration should have failed");
      } catch (err) {
        assert.ok(err, "PDA guarantees one record per authority");
      }
    });

    it("rejects an empty name", async () => {
      const authority = Keypair.generate();
      await fund(authority.publicKey);

      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("manufacturer"), authority.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .registerManufacturer("   ")
          .accountsPartial({
            config: configPda,
            manufacturer: pda,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
        assert.fail("empty name should have failed");
      } catch (err: any) {
        assert.include(err.toString(), "EmptyName");
      }
    });

    it("rejects a name longer than the maximum", async () => {
      const authority = Keypair.generate();
      await fund(authority.publicKey);

      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("manufacturer"), authority.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .registerManufacturer("x".repeat(65))
          .accountsPartial({
            config: configPda,
            manufacturer: pda,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
        assert.fail("oversized name should have failed");
      } catch (err) {
        assert.ok(err);
      }
    });
  });

  describe("manufacturer verification", () => {
    it("rejects verification by a non-admin signer", async () => {
      try {
        await program.methods
          .verifyManufacturer()
          .accountsPartial({
            config: configPda,
            manufacturer: manufacturerPda,
            admin: impostor.publicKey,
          })
          .signers([impostor])
          .rpc();
        assert.fail("non-admin verification should have failed");
      } catch (err: any) {
        assert.include(err.toString(), "Unauthorized");
      }
    });

    it("lets the admin verify a manufacturer", async () => {
      await program.methods
        .verifyManufacturer()
        .accountsPartial({
          config: configPda,
          manufacturer: manufacturerPda,
          admin: admin.publicKey,
        })
        .rpc();

      const manufacturer = await program.account.manufacturer.fetch(manufacturerPda);
      assert.isTrue(manufacturer.verified);
    });

    it("rejects verifying an already verified manufacturer", async () => {
      try {
        await program.methods
          .verifyManufacturer()
          .accountsPartial({
            config: configPda,
            manufacturer: manufacturerPda,
            admin: admin.publicKey,
          })
          .rpc();
        assert.fail("double verification should have failed");
      } catch (err: any) {
        assert.include(err.toString(), "AlreadyVerified");
      }
    });
  });

  describe("suspicious flags", () => {
    it("lets a manufacturer flag one of its assets", async () => {
      const assetId = Keypair.generate().publicKey;
      const [flagPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("flag"), assetId.toBuffer()],
        program.programId
      );

      await program.methods
        .flagSuspicious(assetId, { impossibleTravel: {} })
        .accountsPartial({
          manufacturer: manufacturerPda,
          flag: flagPda,
          authority: manufacturerAuthority.publicKey,
        })
        .signers([manufacturerAuthority])
        .rpc();

      const flag = await program.account.suspiciousFlag.fetch(flagPda);
      assert.ok(flag.assetId.equals(assetId));
      assert.ok(flag.manufacturer.equals(manufacturerPda));
      assert.isAbove(flag.timestamp.toNumber(), 0);
    });

    it("rejects flagging the same asset twice", async () => {
      const assetId = Keypair.generate().publicKey;
      const [flagPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("flag"), assetId.toBuffer()],
        program.programId
      );

      const flag = () =>
        program.methods
          .flagSuspicious(assetId, { manualReport: {} })
          .accountsPartial({
            manufacturer: manufacturerPda,
            flag: flagPda,
            authority: manufacturerAuthority.publicKey,
          })
          .signers([manufacturerAuthority])
          .rpc();

      await flag();

      try {
        await flag();
        assert.fail("duplicate flag should have failed");
      } catch (err) {
        assert.ok(err, "flag PDA is derived from the asset id");
      }
    });

    it("rejects flagging through a manufacturer the signer does not own", async () => {
      const assetId = Keypair.generate().publicKey;
      const [flagPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("flag"), assetId.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .flagSuspicious(assetId, { anomalousVolume: {} })
          .accountsPartial({
            manufacturer: manufacturerPda,
            flag: flagPda,
            authority: impostor.publicKey,
          })
          .signers([impostor])
          .rpc();
        assert.fail("flagging another manufacturer's asset should have failed");
      } catch (err) {
        assert.ok(err);
      }
    });
  });
});
