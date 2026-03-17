import Header from "../../../components/header";
import { Footer } from "../../../components/footer";
import AnimatedAuth from '../../../components/auth/AnimatedAuth';

export default function LoginPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Header
        themeColors={{
          light: { bgInitial: "transparent", bgScrolled: "#F5F0E8", textInitial: "#443831", textScrolled: "#443831" },
          dark: { bgInitial: "transparent", bgScrolled: "#111a28", textInitial: "#d2ad82", textScrolled: "#d2ad82" },
        }}
      />

      <div className="flex-1 pt-20">
        <AnimatedAuth 
          leftPanelTitle="JOIN NyayAI!"
          leftPanelSubtitle="Create an account to access the legal command center and start your journey with us."
          rightPanelTitle="WELCOME TO NyayAI!"
          rightPanelSubtitle="Log in to your digital command center. Manage cases, assign tasks, and track real-time progress."
          themeColor="#997953"
          themeColorDark="#cdaa80"
          backgroundColor="#F5F0E8"
          backgroundColorDark="#0f1e3f"
          textColor="#443831"
          textColorDark="#E8E2D6"
          backdrop="transparent"
          backdropDark="transparent"
          leftPanelImage="/Background_light.png"
          rightPanelImage="/Background_light.png"
        />
      </div>

      <Footer />
    </main>
  );
}
