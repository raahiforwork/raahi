"use client";

import Image from "next/image";
import * as React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InnerNavbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
  
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }


    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };


    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="z-50 fixed top-0 left-0 w-full bg-black text-green-800 px-6 py-2 flex justify-between items-center shadow-lg shadow-gray-800">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2">
        <Image
          src="/logo.png"
          alt="Raahi Logo"
          width={48}
          height={48}
          className="object-fill"
        />
        <span className="text-xl font-bold gradient-text">Raahi</span>
      </Link>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
  
        {isInstallable && !isInstalled && (
          <Button
            onClick={handleInstallClick}
            className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={16} />
            Install
          </Button>
        )}

        {user && (
          <>
            <Link href="/chat">
              <Button className="bg-green-100 text-green-800 hover:bg-green-200">
                Chat
              </Button>
            </Link>
            <Button
              onClick={handleLogout}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Logout
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
