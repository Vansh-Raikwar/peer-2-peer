import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ThemeToggle from "../ThemeToggle";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" id="nav-logo" className="text-[15px] font-semibold tracking-tight">
          Peerly
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
          <a
            href="#how-it-works"
            id="nav-how-it-works"
            className="hidden text-[13px] text-muted transition-colors hover:text-accent md:block"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            How it works
          </a>
          <a
            href="#features"
            id="nav-features"
            className="hidden text-[13px] text-muted transition-colors hover:text-accent md:block"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Features
          </a>
          <a
            href="#faq"
            id="nav-faq"
            className="hidden text-[13px] text-muted transition-colors hover:text-accent md:block"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            FAQ
          </a>

          <ThemeToggle />

          <Link
            to="/app"
            id="nav-start-sharing"
            className="glow-btn group flex items-center gap-1.5 rounded-full bg-accent text-white px-4 py-1.5 text-[13px] font-medium transition-all hover:opacity-90 shadow-sm"
          >
            Start Sharing
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
