"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart2,
  Calculator,
  Car,
  Briefcase,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";
import Topnav from "@/components/Navbar/TopNav";
import Link from "next/link";
import Image from "next/image";

export default function LoanManagement() {
  const [greeting, setGreeting] = useState("");
  const [timeEmojis, setTimeEmojis] = useState([]);
  const [userName, setUserName] = useState("");
  const [motivationalPhrase, setMotivationalPhrase] = useState("");
  const [activeToolIndex, setActiveToolIndex] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserName(userData.username || "User");
    }

    // Set greeting based on time of day with fun emojis
    const hours = new Date().getHours();

    if (hours >= 1 && hours < 12) {
      setGreeting("Good Morning");
      setTimeEmojis(["🌅", "☕", "😊"]);
      setMotivationalPhrase("Let's make today productive!");
    } else if (hours >= 12 && hours < 17) {
      setGreeting("Good Afternoon");
      setTimeEmojis(["☀️", "🚀", "😎"]);
      setMotivationalPhrase("Keep up the momentum!");
    } else if (hours >= 17 && hours < 20) {
      setGreeting("Good Evening");
      setTimeEmojis(["🌆", "🍵", "😃"]);
      setMotivationalPhrase("Final push before you wrap up!");
    } else {
      setGreeting("Good Night");
      setTimeEmojis(["🌙", "✨", "😌"]);
      setMotivationalPhrase("Planning tomorrow's success?");
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 1000);
  };

  const tools = [
    {
      title: "Dashboard",
      icon: BarChart2,
      color: "bg-gradient-to-br from-violet-500 to-violet-700",
      textColor: "text-violet-600",
      shadow: "shadow-violet-200",
      link: "#",
      description: "Return to your main dashboard and overview",
      onClick: () => {
        window.location.reload();
      },
    },
    {
      title: "Business Loan Calculator",
      icon: Briefcase,
      color: "bg-gradient-to-br from-blue-500 to-blue-700",
      textColor: "text-blue-600",
      shadow: "shadow-blue-200",
      link: "loans/business-loan/bG9naW49MixjaG9vc2U9MixjdXN0b21lcj0w",
      description: "Calculate payment plans and interest for business loans",
    },
    {
      title: "Auto Loan Calculator",
      icon: Car,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-700",
      textColor: "text-emerald-600",
      shadow: "shadow-emerald-200",
      link: "/loans/auto-loan/bG9naW49MixjaG9vc2U9MixjdXN0b21lcj0w",
      description: "Plan your vehicle financing with our auto loan calculator",
    },
    {
      title: "Equipment Loan Calculator",
      icon: Calculator,
      color: "bg-gradient-to-br from-amber-500 to-amber-700",
      textColor: "text-amber-600",
      shadow: "shadow-amber-200",
      link: "loans/equipment-loan/bG9naW49MixjaG9vc2U9MixjdXN0b21lcj0w",
      description: "Estimate payments for equipment financing",
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
                  {greeting}, {userName}{" "}
                  {timeEmojis.map((emoji, index) => (
                    <span key={index} className="ml-1 animate-pulse">
                      {emoji}
                    </span>
                  ))}
                </h1>
                <p className="text-base text-gray-600 mt-2 font-medium">
                  {motivationalPhrase} Access your financial tools below.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleRefresh}
                  className="bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  aria-label="Refresh dashboard"
                >
                  <RefreshCw
                    className={`w-5 h-5 text-gray-600 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                </button>
                <div className="bg-white p-2 rounded-md shadow-md">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="rounded-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool, index) => (
              <Link
                href={tool.link}
                key={index}
                onClick={tool.onClick}
                className="block group"
              >
                <Card
                  className={`bg-white rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl ${
                    tool.shadow
                  } h-full border-0 ${
                    activeToolIndex === index
                      ? "ring-2 ring-gray-300 animate-pulse"
                      : ""
                  }`}
                  onMouseEnter={() => setActiveToolIndex(index)}
                  onMouseLeave={() => setActiveToolIndex(null)}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl ${tool.color} text-white shadow-lg`}
                      >
                        <tool.icon className="w-6 h-6" />
                      </div>
                      <Info className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <h3 className="font-semibold text-gray-800 text-lg mb-2">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-600 flex-grow leading-relaxed">
                      {tool.description}
                    </p>

                    <div
                      className={`mt-4 flex items-center ${tool.textColor} text-sm font-semibold group-hover:translate-x-1 transition-transform`}
                    >
                      <span>
                        {index === 0 ? "Open dashboard" : "Open calculator"}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
