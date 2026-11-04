"use client"
import Image from "next/image";
import { redirect } from "next/navigation";  
import { useEffect, useState } from "react";


export default function Home() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(()=>{
    const loggedIn = JSON.parse(localStorage.getItem("user"));


    if(loggedIn){
      if(loggedIn.data.user.mustChangePassword){
        redirect("/set-password")
      }
      if(loggedIn.data.user.role === "SUPER_ADMIN"){
        redirect("/superadmin")
      }
      if(loggedIn.data.user.role === "BRANCH_ADMIN"){
        redirect("/branchadmin")
      }
      if(loggedIn.data.user.role === "FACULTY"){
        redirect("/faculty")
      }
      if(loggedIn.data.user.role === "STAFF"){
        redirect("/staff")
      }      
    }else{
      redirect("/login")
    }
  },[])


  return (
    <>
    
    </>
  );
}
