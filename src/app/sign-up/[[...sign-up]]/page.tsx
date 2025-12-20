import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center animate-fade-in">
      <SignUp appearance={{
        elements: {
          card: "glass-panel bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl",
          headerTitle: "text-white",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
          dividerLine: "bg-white/10",
          dividerText: "text-slate-400",
          formFieldLabel: "text-slate-300",
          formFieldInput: "bg-white/5 border-white/10 text-white",
          footerActionText: "text-slate-400",
          footerActionLink: "text-purple-400 hover:text-purple-300"
        }
      }} />
    </div>
  );
}