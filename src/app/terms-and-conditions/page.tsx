"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Terms and Conditions – Raahi
      </h1>

      <section className="space-y-6 text-justify text-base leading-relaxed">
        <div>
          <h2 className="font-semibold text-lg mb-2">1. Nature of Service</h2>
          <p>
            Raahi is a student-led, non-commercial platform founded by Ayush
            Rathore and Mahek Advani, with Aditya Pandey as the CEO. The
            platform is created solely to facilitate voluntary carpooling among
            students of Bennett University. Raahi does not operate as a
            transport service provider, commercial aggregator, or travel agency.
            It merely acts as an online medium where users (students) may
            connect to coordinate ride-sharing arrangements.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            2. No Agency or Liability
          </h2>
          <p>
            Raahi, including its founders, CEO, or any individual associated
            with the platform, is not a party to any agreement entered into
            between users. All ride-sharing arrangements are made directly and
            voluntarily between the Car Owner (Driver) and the Co-Traveller
            (Passenger).
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>
              Raahi bears no responsibility or liability for the conduct,
              punctuality, driving skill, vehicle condition, or behavior of any
              user.
            </li>
            <li>
              In case of any mishap, accident, injury, damage, delay, or
              dispute, Raahi and its team shall not be held liable, whether
              civil, criminal, financial, or otherwise.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            3. No Insurance Obligation
          </h2>
          <p>
            Raahi does not provide or ensure any form of insurance for users or
            vehicles. It is the sole responsibility of the Car Owner to ensure
            compliance with legal and insurance requirements, including valid:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>Driver’s license</li>
            <li>Motor insurance</li>
            <li>Pollution Under Control (PUC) certificate</li>
            <li>Vehicle registration</li>
          </ul>
          <p>
            Raahi does not verify these documents and does not take any
            responsibility for their validity or existence.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            4. Voluntary Participation &amp; Assumption of Risk
          </h2>
          <p>By using the platform, users acknowledge and agree that:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>They are participating voluntarily.</li>
            <li>They accept all risks associated with ride-sharing.</li>
            <li>
              They shall exercise personal judgment before entering into any
              carpool agreement.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            5. Limitation of Liability
          </h2>
          <p>To the fullest extent permitted under applicable law:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>
              Raahi, its founders, CEO, and affiliates shall not be liable for
              any direct, indirect, incidental, special, consequential, or
              punitive damages arising out of the use of the platform.
            </li>
            <li>
              Raahi’s total aggregate liability, if any, shall be strictly
              limited to INR 1,000 (Indian Rupees One Thousand only).
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">6. Indemnity</h2>
          <p>
            Users agree to indemnify, defend, and hold harmless Raahi, its team,
            and affiliates from any claims, demands, liabilities, damages, or
            losses arising out of:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>Violation of terms of use</li>
            <li>Any incident or dispute during a carpool trip</li>
            <li>Non-compliance with legal or safety standards by a user</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">7. Jurisdiction</h2>
          <p>
            These terms are governed by the laws of India. Any disputes arising
            from or in connection with the use of Raahi shall be subject to the
            exclusive jurisdiction of the courts in New Delhi.
          </p>
        </div>
      </section>
      <div className="mt-8 text-center text-black">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 border"
        >
          &larr; Back
        </button>
      </div>
    </main>
  );
}
