"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Check, X, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PlanFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

interface Plan {
  id: string;
  name: string;
  price: {
    monthly: number | "Free";
    yearly: number | "Free";
  };
  description: string;
  buttonText: string;
  buttonDisabled?: boolean;
  isFeatured?: boolean;
  badges?: string[];
  features: PlanFeature[];
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: { monthly: "Free", yearly: "Free" },
    description: "Perfect for getting started",
    buttonText: "Get Started",
    buttonDisabled: true,
    features: [
      { text: "10 credits per day", included: true },
      { text: "~10 Fast Mode images per day", included: true },
      { text: "Unlimited Basic generations (Slow Queue)", included: true, tooltip: "Basic generations are processed in a slower queue with longer wait times" },
      { text: "Basic features", included: true },
      { text: "Community support", included: true },
      { text: "~2 Raphael Videos/day", included: true, tooltip: "Video generation using the Raphael model" },
      { text: "Images include watermark (free plan). Upgrade to remove.", included: false },
      { text: "Basic model only (No Pro/Max/Ultra access)", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: { monthly: 20, yearly: 10 },
    description: "",
    buttonText: "Upgrade to Premium",
    features: [
      { text: "2,000 credits per month", included: true },
      { text: "~2,000 Fast Mode images", included: true },
      { text: "~400 Raphael Videos/mo", included: true, tooltip: "Monthly video generation allowance" },
      { text: "Unlimited Basic generations", included: true, tooltip: "Generate unlimited images using basic models" },
      { text: "Priority queue", included: true, tooltip: "Your generations are processed before free users" },
      { text: "Unlock Raphael Pro (1K)", included: true, tooltip: "Access to Raphael Pro model with 1K resolution" },
      { text: "No ads", included: true },
      { text: "No watermarks", included: true },
      { text: "Fast AI Photo Editor", included: true, tooltip: "Quick access to AI-powered photo editing tools" },
    ],
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: { monthly: 40, yearly: 20 },
    description: "",
    buttonText: "Upgrade to Ultimate",
    isFeatured: true,
    badges: ["Best Value", "Save 50%"],
    features: [
      { text: "5,000 credits per month", included: true },
      { text: "~5,000 Fast Mode images", included: true },
      { text: "~1,000 Raphael Videos/mo", included: true, tooltip: "Monthly video generation allowance" },
      { text: "Unlimited Basic generations", included: true, tooltip: "Generate unlimited images using basic models" },
      { text: "Highest priority queue", included: true, tooltip: "Your generations are processed first, before all other users" },
      { text: "Unlock Raphael Pro (1K)", included: true, tooltip: "Access to Raphael Pro model with 1K resolution" },
      { text: "Unlock Max (1.5K) & Ultra (2K)", included: true, tooltip: "Access to Max (1.5K) and Ultra (2K) resolution models" },
      { text: "Full privacy", included: true, tooltip: "Your generations are not used for training or shared publicly" },
      { text: "No ads", included: true },
      { text: "No watermarks", included: true },
      { text: "Instant AI Photo Editor", included: true, tooltip: "Instant access to AI-powered photo editing tools with no wait time" },
      { text: "Advanced Refine feature", included: true, tooltip: "Fine-tune your generations with advanced controls" },
      { text: "Early access to new features", included: true, tooltip: "Be the first to try new features before public release" },
    ],
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

  const handleCheckout = (plan: Plan) => {
    console.log("Checkout clicked for:", plan);
    alert("Payment integration removed. Please implement your own payment system.");
  };

  const getPrice = (plan: Plan) => {
    const price = isYearly ? plan.price.yearly : plan.price.monthly;
    if (price === "Free") return "Free";
    return `$${price}`;
  };

  const getPriceUnit = (plan: Plan) => {
    if (plan.price.yearly === "Free") return "";
    return "/month";
  };

  return (
    <TooltipProvider>
      <section
        id="pricing"
        className="relative z-0 pb-14 md:pb-20 lg:pb-24"
        style={{ paddingTop: 'calc(96px + var(--locale-banner-height, 0px))' }}
      >
        <div className="container">
          {/* Header */}
          <div id="plans" className="mx-auto mb-12 text-center scroll-mt-24">
            <h2 className="mb-4 text-4xl font-semibold lg:text-5xl">Choose Your Plan</h2>
            <p className="text-muted-foreground lg:text-lg">
              Free images include a watermark. Upgrade for clean outputs, faster generation, and commercial use.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4">
              <span className={!isYearly ? "font-medium" : "text-muted-foreground"}>Monthly</span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <div className="relative flex items-center">
                <span className={isYearly ? "font-medium" : "text-muted-foreground"}>Yearly</span>
                <div className="absolute -top-3.5 left-full -ml-1.5">
                  <div className="inline-flex items-center border whitespace-nowrap rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-red-600 border-red-200 shadow-sm">
                    Save 50%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, index) => {
              const orderClass = plan.id === "free"
                ? "order-3 md:order-none"
                : plan.id === "premium"
                  ? "order-2 md:order-none"
                  : "order-1 md:order-none";

              return (
                <div
                  key={plan.id}
                  className={`rounded-lg p-6 transition-all duration-300 hover:-translate-y-1 ${orderClass} ${
                    plan.isFeatured
                      ? "border-2 border-primary/80 bg-primary/5 shadow-xl shadow-primary/20 hover:shadow-xl"
                      : plan.id === "free"
                        ? "border border-muted/40 bg-card/60 hover:shadow-md"
                        : "border border-muted hover:shadow-xl"
                  }`}
                >
                  <div className="flex h-full flex-col justify-between gap-5">
                    <div>
                      {/* Plan Name & Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                        {plan.isFeatured && (
                          <>
                            <Badge className="border-primary bg-primary px-1.5 text-primary-foreground">
                              Best Value
                            </Badge>
                            <div className="inline-flex items-center border whitespace-nowrap rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-red-600 border-red-200 shadow-sm">
                              Save 50%
                            </div>
                          </>
                        )}
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <span className="text-5xl font-semibold">{getPrice(plan)}</span>
                        {getPriceUnit(plan) && (
                          <span className="text-muted-foreground">{getPriceUnit(plan)}</span>
                        )}
                        {plan.price.yearly !== "Free" && isYearly && (
                          <div className="text-sm text-muted-foreground mt-1">Billed Annually</div>
                        )}
                      </div>

                      {/* Description */}
                      {plan.description && (
                        <p className="text-muted-foreground mb-6">{plan.description}</p>
                      )}

                      {/* Button */}
                      <Button
                        onClick={() => handleCheckout(plan)}
                        disabled={plan.buttonDisabled}
                        className={`w-full mb-6 ${
                          plan.isFeatured
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl"
                            : plan.buttonDisabled
                              ? "border border-muted/50 text-muted-foreground hover:text-foreground bg-background hover:bg-accent"
                              : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        }`}
                        variant={plan.isFeatured ? "default" : "outline"}
                        style={plan.buttonDisabled ? { pointerEvents: "none", opacity: 0.6 } : {}}
                      >
                        {plan.buttonText}
                      </Button>

                      {/* Features */}
                      <ul className="flex flex-col gap-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex gap-2 items-start">
                            {feature.included ? (
                              <Check className="mt-1 size-4 shrink-0 text-primary" />
                            ) : (
                              <X className="mt-1 size-4 shrink-0 text-muted-foreground/70" />
                            )}
                            <span className={`flex items-center gap-1 ${!feature.included ? "text-muted-foreground" : ""}`}>
                              {feature.text}
                              {feature.tooltip && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{feature.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
