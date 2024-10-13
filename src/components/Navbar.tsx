import Link from "next/link";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { buttonVariants } from "./ui/button";
import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { ArrowRight } from "lucide-react";


const Navbar = () => {
  return (
    <nav className="sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all">
      <MaxWidthWrapper>
        <div className="flex h-14 items-center justify-between border-b border-zinc-200">
          {/* Main Logo */}
          <Link href="/" className="flex z-40 font-semibold">
            <span>DocTalk.</span>
          </Link>

          {/* Add mobile navbar (optional for future) */}

          <div className="hidden items-center space-x-4 sm:flex">
            <>
              {/* Pricing Link */}
              <Link
                href="/pricing"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                })}>
                Pricing
              </Link>

              {/* Kinde Auth: Login Button */}
              <LoginLink
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                })}>
                Sign in
              </LoginLink> 

              {/* Kinde Auth: Register Button */}
              <RegisterLink 
                className={buttonVariants({
                  size: "sm",
                })}>
                Get Started <ArrowRight className="ml-1.5 h-5 w-5" />
              </RegisterLink>

            </>
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
