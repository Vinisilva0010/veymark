use anchor_lang::prelude::*;

declare_id!("9tCeoRVp4MRZTM6hxtJp2Nd797i1Mf2JbwLgXE6JFZcp");

pub const MAX_NAME_LEN: usize = 64;

#[program]
pub mod veymark {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.manufacturer_count = 0;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn register_manufacturer(ctx: Context<RegisterManufacturer>, name: String) -> Result<()> {
        require!(!name.trim().is_empty(), VeymarkError::EmptyName);
        require!(name.len() <= MAX_NAME_LEN, VeymarkError::NameTooLong);

        let manufacturer = &mut ctx.accounts.manufacturer;
        manufacturer.authority = ctx.accounts.authority.key();
        manufacturer.name = name;
        manufacturer.verified = false;
        manufacturer.parts_count = 0;
        manufacturer.bump = ctx.bumps.manufacturer;

        let config = &mut ctx.accounts.config;
        config.manufacturer_count = config
            .manufacturer_count
            .checked_add(1)
            .ok_or(VeymarkError::Overflow)?;

        emit!(ManufacturerRegistered {
            manufacturer: manufacturer.key(),
            authority: manufacturer.authority,
        });

        Ok(())
    }

    pub fn verify_manufacturer(ctx: Context<VerifyManufacturer>) -> Result<()> {
        let manufacturer = &mut ctx.accounts.manufacturer;
        require!(!manufacturer.verified, VeymarkError::AlreadyVerified);
        manufacturer.verified = true;

        emit!(ManufacturerVerified {
            manufacturer: manufacturer.key(),
            authority: manufacturer.authority,
        });

        Ok(())
    }

    pub fn flag_suspicious(
        ctx: Context<FlagSuspicious>,
        asset_id: Pubkey,
        reason: FlagReason,
    ) -> Result<()> {
        let flag = &mut ctx.accounts.flag;
        flag.asset_id = asset_id;
        flag.manufacturer = ctx.accounts.manufacturer.key();
        flag.flagged_by = ctx.accounts.authority.key();
        flag.reason = reason;
        flag.timestamp = Clock::get()?.unix_timestamp;
        flag.bump = ctx.bumps.flag;

        emit!(AssetFlagged {
            asset_id,
            manufacturer: flag.manufacturer,
            reason,
        });

        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub manufacturer_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Manufacturer {
    pub authority: Pubkey,
    #[max_len(MAX_NAME_LEN)]
    pub name: String,
    pub verified: bool,
    pub parts_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct SuspiciousFlag {
    pub asset_id: Pubkey,
    pub manufacturer: Pubkey,
    pub flagged_by: Pubkey,
    pub reason: FlagReason,
    pub timestamp: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum FlagReason {
    ImpossibleTravel,
    AnomalousVolume,
    ManualReport,
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterManufacturer<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = authority,
        space = 8 + Manufacturer::INIT_SPACE,
        seeds = [b"manufacturer", authority.key().as_ref()],
        bump
    )]
    pub manufacturer: Account<'info, Manufacturer>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyManufacturer<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = admin @ VeymarkError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"manufacturer", manufacturer.authority.as_ref()],
        bump = manufacturer.bump
    )]
    pub manufacturer: Account<'info, Manufacturer>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(asset_id: Pubkey)]
pub struct FlagSuspicious<'info> {
    #[account(
        seeds = [b"manufacturer", authority.key().as_ref()],
        bump = manufacturer.bump,
        has_one = authority @ VeymarkError::Unauthorized
    )]
    pub manufacturer: Account<'info, Manufacturer>,

    #[account(
        init,
        payer = authority,
        space = 8 + SuspiciousFlag::INIT_SPACE,
        seeds = [b"flag", asset_id.as_ref()],
        bump
    )]
    pub flag: Account<'info, SuspiciousFlag>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[event]
pub struct ManufacturerRegistered {
    pub manufacturer: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct ManufacturerVerified {
    pub manufacturer: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct AssetFlagged {
    pub asset_id: Pubkey,
    pub manufacturer: Pubkey,
    pub reason: FlagReason,
}

#[error_code]
pub enum VeymarkError {
    #[msg("Manufacturer name cannot be empty")]
    EmptyName,
    #[msg("Manufacturer name exceeds maximum length")]
    NameTooLong,
    #[msg("Manufacturer is already verified")]
    AlreadyVerified,
    #[msg("Signer is not authorized for this action")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
}
