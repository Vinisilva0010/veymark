import Intro from "@/components/demo/Intro";
import DemoNav from "@/components/demo/DemoNav";
import FactoryStory from "@/components/demo/FactoryStory";
import FieldStory from "@/components/demo/FieldStory";
import AttackStory from "@/components/demo/AttackStory";
import PartBridge from "@/components/demo/PartBridge";

export default function DemoPage() {
  return (
    <main className="dm">
      <Intro />
      <DemoNav />

      <div id="factory">
        <FactoryStory />
      </div>

      <PartBridge
        from="The part leaves the factory"
        to="Now follow it to a workshop"
        line="It carries a chip nobody can copy and a record nobody can rewrite. From here on, everything depends on whether a buyer can tell."
      />

      <div id="field">
        <FieldStory />
      </div>

      <PartBridge
        from="That was the honest path"
        to="Now try to break it"
        line="Everything so far assumed nobody was attacking. Three attacks follow, and every one of them runs for real against the live system."
      />

      <div id="attacks">
        <AttackStory />
      </div>
    </main>
  );
}
