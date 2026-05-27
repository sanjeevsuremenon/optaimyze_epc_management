import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import {useSession} from 'next-auth/react';
import Image from 'next/image';
import Link from "next/link";
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
    <div className="min-h-full my-20 w-ful p-24">
       <p className="mx-auto w-1/2 py-6 text-2xl uppercase font-bold text-zinc-800">
        
        Welcome to lOGIN page of MM Web portal! 
      </p>
      <div className="grid grid-cols-3">
        <div>
          <Image
          src="/JAL.jpg"
          width={640}
          height={640}          
          priority    
          objectFit="contain"
          alt="sideimage"
          />
        </div>

        <div>
       
      <form
        className="flex flex-col gap-2 mt-3 mx-auto w-96"
        onSubmit={handleSubmit}
      >

        <p className="text-amber-800 text-sm   uppercase font-black mb-12">{formErrormsg}</p>
        <div className="flex justify-around mb-9 ">
          {" "}
          <label htmlFor="email" className="font-bold uppercase">
            {" "}
            E-Mail:{" "}
          </label>{" "}
          <input
            type="email"
            name="email"
            id="email"
            placeholder="abc.d@jalint.com.sa"
            className="border border-blue-500"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
        </div>

        <div className="flex justify-around mb-9">
          {" "}
          <label htmlFor="password" className="font-bold uppercase">
            {" "}
            Password{" "}
          </label>{" "}
          <input
            type="password"
            name="password"
            id="password"
            label="password"
            placeholder="****"
            className="border border-green-500"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
        </div>
        <div className="flex flex-col gap-4 items-center mt-6">
          <button
            type="submit"
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white uppercase font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
          >
            <FontAwesomeIcon icon={faSignInAlt} className="text-lg" />
            Login
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-3 font-medium">
              New user? Please register to get started
            </p>
            <div className="flex gap-3 items-center justify-center">
              <Link href="/auth/register" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 transform hover:scale-105">
                  <FontAwesomeIcon icon={faUserPlus} className="text-base" />
                  Register
              </Link>
              <Link href="/" className="bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 transform hover:scale-105">
                  <FontAwesomeIcon icon={faHome} className="text-base" />
                  Return to Home
              </Link>
            </div>
          </div>
        </div>
      </form>
      </div>
        <div>
            <Image
            src="/MMPortalpic1.jpg"
            alt="portal"
            width={640}
            height={640}
            objectFit="contain"
            />
        </div>
        <div></div>
     
    </div>
    </div>
  );
}

export default Loginpage;
