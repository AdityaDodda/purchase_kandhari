import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import {SiLinkedin,SiFacebook,SiInstagram,SiGithub} from "react-icons/si";

export function Footer() {
  return (
    <footer className="bg-[hsl(207,90%,54%)] text-white py-10 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* Company Info */}
        <div>
          <h2 className="text-2xl font-bold mb-3">KGBPL</h2>
          <p className="text-sm leading-relaxed">
            Empowering businesses with seamless solutions.
          </p>
          <div className="mt-4 text-sm space-y-2">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span>Chandigarh, India</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              <span>contact@kgbpl.in</span>
            </div>
            {/* <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              <span>+91 98765 43210</span>
            </div> */}
          </div>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
          <div className="flex space-x-4 text-white text-xl">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <SiLinkedin className="hover:text-gray-300 transition" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <SiFacebook className="hover:text-gray-300 transition" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <SiInstagram className="hover:text-gray-300 transition" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <SiGithub className="hover:text-gray-300 transition" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div className="border-t border-white/30 mt-10 pt-4 text-center text-sm text-white/80">
        &copy; {new Date().getFullYear()} KGBPL. All rights reserved.
      </div>
    </footer>
  );
}