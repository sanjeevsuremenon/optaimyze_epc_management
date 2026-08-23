import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import {useSession} from 'next-auth/react';
import Image from 'next/image';
import Link from "next/link";
import EpcLogo from "../../../components/EpcLogo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faHome,
  faSignInAlt,
} from "@fortawesome/free-solid-svg-icons";


function Loginpage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { data: session } = useSession();
  const [formErrormsg, setFormerrormsg] = useState("");

  React.useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormerrormsg("");

    if (!email.trim() || !password) {
      setFormerrormsg("Please enter both email and password.");
      return;
    }

    try {
      const response = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      console.log({ response });

      if (response?.ok) {
        router.push("/");
      } else {
        setFormerrormsg(response?.error || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setFormerrormsg("Unable to sign in right now. Please try again later.");
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
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-app-text-secondary">
              Sign in to continue to the EPC portal
            </p>
          </div>

          {formErrormsg && (
            <div className="w-full mb-6 p-4 rounded-xl text-center text-sm font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400">
              {formErrormsg}
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
                placeholder="abc.d@jalint.com.sa"
                className="app-input"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
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
                value={password}
              />
            </div>

            <button type="submit" className="w-full app-btn-primary py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold mt-6 shadow-lg shadow-cyan-500/10">
              <FontAwesomeIcon icon={faSignInAlt} className="text-base" />
              Login
            </button>

            <div className="mt-8 pt-6 border-t border-app-border text-center space-y-4">
              <p className="text-xs text-app-text-secondary font-medium">
                New user? Please register to get started:
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/auth/register" className="app-btn-secondary px-5 py-2 text-xs font-bold">
                  <FontAwesomeIcon icon={faUserPlus} />
                  Register
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

export default Loginpage;
