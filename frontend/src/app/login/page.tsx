import AnimatedAuth from '../../../components/auth/AnimatedAuth';

export default function LoginPage() {
  return (
    <main className="min-h-screen">
      <AnimatedAuth 
        leftPanelTitle="JOIN NyayAI!"
        leftPanelSubtitle="Create an account to access the legal command center and start your journey with us."
        rightPanelTitle="WELCOME TO NyayAI!"
        rightPanelSubtitle="Log in to your digital command center. Manage cases, assign tasks, and track real-time progress."
        themeColor="#cbae86"
        themeColorDark="#cbae86"
        backgroundColor="#F5F0E8"
        backgroundColorDark="#0f1e3f"
        textColor="#443831"
        textColorDark="#E8E2D6"
        backdrop="#f4f0d9"
        backdropDark="#0a1229"
        leftPanelImage="/Background_light.png"
        rightPanelImage="/Background_light.png"
      />
    </main>
  );
}
