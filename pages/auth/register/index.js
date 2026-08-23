import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import EpcLogo from "../../../components/EpcLogo";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignInAlt,
  faHome,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";

function Registerpage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user");
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const normalizedEmail = String(email || "").trim();
    const trimmedUsername = String(username || "").trim();

    if (!normalizedEmail || !trimmedUsername || !password) {
      setMessage("Please provide a valid email, username and password.");
      return;
    }

    setIsRegistering(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          name: trimmedUsername,
          role,
        }),
        headers: {
          "Content-type": "application/json",
        },
      });
      
      const data = await response.json();
      console.log({ response, data });

      if (response.ok && data.message === "success!") {
        setMessage(`User ${trimmedUsername} is registered successfully. Redirecting...`);
        setTimeout(() => {
          router.push("/auth/login");
        }, 1800);
      } else {
        setMessage(data?.message || "Registration failed. Please try again.");
        setIsRegistering(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("An error occurred during registration. Please try again.");
      setIsRegistering(false);
    }
  };
  return (
    <div className="app-page min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-app-bg text-app-text">
      <div className="w-full max-w-5xl bg-app-surface border border-app-border rounded-[2.5rem] overflow-hidden shadow-2xl grid md:grid-cols-[1.05fr_0.95fr] min-h-[600px]">
        
        {/* Visual Panel */}
        <div className="relative p-8 md:p-12 bg-gradient-to-br from-cyan-950/20 via-indigo-950/15 to-transparent flex flex-col justify-between overflow-hidden border-r border-app-border hidden md:flex">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-72 w-72 rounded-full bg-cyan-500/5 blur-[80px]"></div>
          
          <div className="flex items-center gap-3">
            <EpcLogo className="h-10 w-10 rounded-xl" />
            <div>
              <p className="text-[10px] tracking-[0.2em] font-extrabold text-app-accent uppercase">EPC-Stack Portal</p>
              <h2 className="text-xs font-black text-app-text">MM Portal</h2>
            </div>
          </div>
          
          <div className="flex justify-center items-center py-6">
            <Image
              src="/images/epc-stack.svg"
              alt="sideimage"
              width={520}
              height={360}
              priority
              className="w-full max-w-[360px] h-auto object-contain rounded-2xl drop-shadow-md"
            />
          </div>
          
          <p className="text-sm text-app-text-secondary leading-6">
            Monitor procurement, vendor collaboration, and project visibility in one place.
          </p>
        </div>

        {/* Form Panel */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-app-surface">
          <div className="mb-8 flex flex-col items-center text-center">
            <EpcLogo className="mb-4 h-12 w-12 rounded-xl bg-app-accent-soft/20 flex items-center justify-center p-2" />
            <h1 className="text-2xl font-black text-app-text">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-app-text-secondary">
              Join the EPC-Stack Intranet MM Portal
            </p>
          </div>

          {message && (
            <div className={`w-full mb-6 p-4 rounded-xl text-center text-sm font-medium border ${
              message.includes("successfully") 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              {message}
            </div>
          )}

          <form className="space-y-5 w-full" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-app-text-secondary uppercase tracking-wider">
                E-Mail Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="ahmed@jalint.com.sa"
                className="app-input"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-xs font-bold text-app-text-secondary uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                placeholder="Ahmed Alzahrani"
                className="app-input"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="role" className="block text-xs font-bold text-app-text-secondary uppercase tracking-wider">
                System Role
              </label>
              <select
                name="role"
                value={role}
                id="role"
                onChange={(e) => setRole(e.target.value)}
                className="app-input"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="project">Project Manager</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-app-text-secondary uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                className="app-input"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={isRegistering} className="w-full app-btn-primary py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold mt-6 shadow-lg shadow-cyan-500/10">
              <FontAwesomeIcon icon={faUserPlus} className="text-base" />
              {isRegistering ? "Registering..." : "Register"}
            </button>

            <div className="mt-8 pt-6 border-t border-app-border text-center space-y-4">
              <p className="text-xs text-app-text-secondary font-medium">
                Already registered? Please sign in:
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/auth/login" className="app-btn-secondary px-5 py-2 text-xs font-bold">
                  <FontAwesomeIcon icon={faSignInAlt} />
                  Sign In
                </Link>
                <Link href="/" className="app-btn-secondary px-5 py-2 text-xs font-bold">
                  <FontAwesomeIcon icon={faHome} />
                  Home
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Registerpage;
