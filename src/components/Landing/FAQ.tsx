"use client";

import * as React from "react";
import { Plus, Minus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    question: "How does Raahi work?",
    answer:
      "Raahi connects drivers and passengers traveling in the same direction. Simply enter your route, find matches, chat with potential carpool partners, and share the journey. Our smart algorithm matches you based on your route, schedule, and preferences.",
  },
  {
    question: "Is Raahi safe and secure?",
    answer:
      "Yes! All users undergo identity verification and background checks. We provide real-time tracking, in-app messaging, user ratings, and 24/7 support. You can view driver/passenger profiles and reviews before booking.",
  },
  {
    question: "How much money can I save?",
    answer:
      "Users typically save 60-75% on their commuting costs. For example, if your daily commute costs ₹200, carpooling can reduce it to ₹50-80 per day. Plus, drivers can earn by sharing rides and covering their fuel costs.",
  },
  {
    question: "How do payments work?",
    answer:
      "Payments are handled securely through the app. Passengers can pay via UPI, cards, or digital wallets. The cost is automatically split based on distance and shared fairly among passengers. Drivers receive payments directly to their account.",
  },
  {
    question: "What if my plans change?",
    answer:
      "We understand plans change! You can cancel rides up to 2 hours before departure time. For last-minute cancellations, minimal fees may apply to ensure fairness for other riders. You can also reschedule rides easily through the app.",
  },
  {
    question: "Can I choose who I ride with?",
    answer:
      "Absolutely! You can view profiles, ratings, and reviews of potential carpool partners. Our chat feature lets you connect before booking. You can also set preferences for gender, smoking, music, etc. to find the best match.",
  },
  {
    question: "What about insurance coverage?",
    answer:
      "All registered drivers must have valid insurance. Raahi also provides additional coverage for passengers during trips. However, we recommend checking with your insurance provider about carpool coverage for complete peace of mind.",
  },
  {
    question: "How do I handle disputes or issues?",
    answer:
      "Our 24/7 support team is here to help! You can report issues through the app, rate your experience, and provide feedback. We take all reports seriously and work quickly to resolve disputes fairly for all parties involved.",
  },
  {
    question: "What makes Raahi different from other apps?",
    answer:
      "Raahi focuses on building a community of trusted travelers. We offer advanced safety features, smart matching algorithms, flexible scheduling, and transparent pricing. Our goal is to make carpooling social, safe, and sustainable.",
  },
];

export default function FAQ() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Got Questions?
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about using Raahi for your daily
            commute and carpooling needs.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-lg px-6 py-2 bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact support section */}
        <div className="mt-16 text-center">
          <div className="bg-card border border-border rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-3">
              Still have questions
            </h3>
            <p className="text-muted-foreground mb-6">
              Our friendly
              support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
             
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors" onClick={() => window.open('https://linktr.ee/ridewithraahi', '_blank')}>
                Join Community
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
