export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#FFF2EB_0%,_transparent_50%)]" />
      {children}
    </div>
  );
}
