import Image from "next/image";

export default function LogoLoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-openboy-bg flex items-center justify-center">
      <Image
        src="/logos/logo.png"
        alt="OpenBoy"
        width={80}
        height={80}
        priority
        className="object-contain"
      />
    </div>
  );
}
