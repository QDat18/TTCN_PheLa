import React, { useState } from "react";
import { motion } from "framer-motion";
import phela from "../../../assets/images/phela.jpg"; // Import ảnh
import Login from "./LoginAdmin";
import Register from "./RegisterAdmin";

const LoginRegister = () => {
    const [isRegister, setIsRegister] = useState(false);

    const toggleForm = () => {
        setIsRegister(!isRegister);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="relative w-full h-screen flex overflow-hidden">
                {/* Form (Login hoặc Register) */}
                <motion.div
                    animate={{ x: isRegister ? "0%" : "0%" }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="flex w-[200%] h-full"
                >
                    {/* Login Form */}
                    <div className="w-1/2 h-full">
                        <Login />
                    </div>

                    {/* Register Form */}
                    <div className="w-1/2 h-full">
                        <Register />
                    </div>
                </motion.div>

                {/* Ảnh */}
                <motion.div
                    className="absolute top-0 left-1/2 w-1/2 h-full bg-cover bg-center flex items-end justify-center"
                    style={{
                        backgroundImage: `url(${phela})`,
                    }}
                    animate={{ x: isRegister ? "-100%" : "0%" }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                    <button
                        onClick={toggleForm}
                        className="mb-40 px-6 py-1.5 text-white text-2xl border hover:backdrop-brightness-75 hover:text-black rounded shadow-2xs shadow-neutral-200"
                    >
                        {isRegister ? "Login" : "Register"}
                    </button>
                </motion.div>

            </div>
        </div>
    );
};

export default LoginRegister;