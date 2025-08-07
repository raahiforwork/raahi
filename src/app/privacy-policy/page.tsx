"use client";
import { useRouter } from "next/navigation";
import React from "react";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Privacy Policy – Raahi
      </h1>

      <section className="space-y-6 text-justify text-base leading-relaxed">
        <div>
          <h2 className="font-semibold text-lg mb-2">1. Introduction</h2>
          <p>
            Raahi is a student-led platform created by and for Bennett
            University students, dedicated to facilitating voluntary carpooling.
            This Privacy Policy outlines how Raahi collects, uses, and protects
            your personal information.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            2. Information We Collect
          </h2>
          <p>We may collect and process the following personal information:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Name</li>
            <li>Bennett University email address</li>
            <li>Phone number (if provided by you)</li>
            <li>
              Basic carpool-related preferences (such as pickup/drop locations,
              timings, etc.)
            </li>
            <li>Any communications sent via the platform</li>
          </ul>
          <p>
            We do <strong>not</strong> collect financial details or sensitive
            personal information.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            3. How Your Information Is Used
          </h2>
          <ul className="list-disc ml-6 mt-2">
            <li>To enable voluntary carpool coordination among students</li>
            <li>
              To communicate important updates or notifications related to Raahi
            </li>
            <li>To maintain platform safety and integrity</li>
            <li>To improve our services based on user feedback</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">4. Information Sharing</h2>
          <ul className="list-disc ml-6 mt-2">
            <li>
              Raahi does <strong>not</strong> share, sell, or rent your personal
              information to any third parties, organizations, or commercial
              entities.
            </li>
            <li>
              Only limited contact information may be shared with other
              registered students for the purpose of coordinating rides, as part
              of your voluntary use of the platform.
            </li>
            <li>
              We may disclose your information if required by law or to protect
              the rights, property, or safety of Raahi or others.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">5. Data Security</h2>
          <p>
            We implement reasonable security measures to protect your
            information from unauthorized access, use, or disclosure. However,
            as a student-led non-commercial project, we cannot guarantee
            absolute security and recommend that you share sensitive information
            with caution.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            6. Your Rights and Choices
          </h2>
          <ul className="list-disc ml-6 mt-2">
            <li>
              You may review and update your personal details by contacting the
              Raahi team.
            </li>
            <li>
              You may request deletion of your information from our records at
              any time, subject to platform requirements.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            7. Changes to This Policy
          </h2>
          <p>
            Raahi may update this Privacy Policy from time to time. Significant
            changes will be communicated on the platform. Continued use of Raahi
            after changes constitutes acceptance of the revised policy.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">8. Contact Us</h2>
          <p>
            For questions, concerns, or requests regarding your privacy or this
            policy, please contact the Raahi team or platform administrators at
            Bennett University.
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
