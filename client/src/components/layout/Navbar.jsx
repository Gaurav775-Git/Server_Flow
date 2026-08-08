import { Search, CircleUserRound, ChevronDown } from "lucide-react";
import serverFlowLogo from "../../assets/ServerFlow-logo.png";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">

      {/* Server Flow Logo */}
      <div className="navbar-logo">
        <img 
            src={serverFlowLogo}
            alt="Server Flow"
        />
      </div>

      {/* Navigation Links */}
      <div className="navbar-links">

        <a href="#" className="nav-link">
          Products
          <ChevronDown size={12} />
        </a>

        <a href="#" className="nav-link">
          Solutions
          <ChevronDown size={12} />
        </a>

        <a href="#" className="nav-link">
          Developers
          <ChevronDown size={12} />
        </a>

        <a href="#" className="nav-link">
          Pricing
        </a>

        <a href="#" className="nav-link">
          Docs
        </a>

      </div>

      {/* Right Side Actions */}
      <div className="navbar-actions">

        <button
          className="icon-button"
          aria-label="Search"
        >
          <Search size={19} strokeWidth={1.8} />
        </button>

        <button
          className="icon-button"
          aria-label="Account"
        >
          <CircleUserRound size={19} strokeWidth={1.8} />
        </button>

        <a href="#" className="contact-link">
          Contact Sales
        </a>

        <a href="#" className="start-button">
          Start Building
        </a>

      </div>

    </nav>
  );
}

export default Navbar;