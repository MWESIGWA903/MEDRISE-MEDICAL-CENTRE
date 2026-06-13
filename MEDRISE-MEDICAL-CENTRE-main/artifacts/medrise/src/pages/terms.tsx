import { Helmet } from 'react-helmet-async';

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | MedRise Medical Centre</title>
        <meta name="description" content="Terms of Service for MedRise Medical Centre. Read our terms and conditions for using our healthcare services." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-blue-900 px-6 py-8">
              <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
              <p className="text-blue-200 mt-2">Last Updated: June 13, 2026</p>
            </div>
            
            <div className="px-6 py-8 prose prose-blue max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 mb-4">
                  By accessing or using the MedRise Medical Centre website and services, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Medical Services</h2>
                <p className="text-gray-700 mb-4">
                  MedRise Medical Centre provides general medical, maternity, laboratory, pharmacy, dental, and specialist healthcare services.
                  We reserve the right to modify, suspend, or discontinue any service at any time without prior notice.
                </p>
                <p className="text-gray-700">
                  Our services are not a substitute for emergency medical care. In case of a medical emergency, 
                  please call emergency services or visit the nearest emergency department immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Appointment Booking</h2>
                <p className="text-gray-700 mb-4">
                  Appointment requests submitted through our website are subject to availability and confirmation by our staff.
                  We will make reasonable efforts to accommodate your preferred time but cannot guarantee specific appointment times.
                </p>
                <p className="text-gray-700">
                  Please arrive on time for your appointment. Late arrivals may result in rescheduling or reduced consultation time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Patient Information</h2>
                <p className="text-gray-700 mb-4">
                  By providing personal and medical information through our services, you consent to our collection, use, and storage 
                  of such information as described in our Privacy Policy.
                </p>
                <p className="text-gray-700">
                  You agree to provide accurate, complete, and current information. You are responsible for maintaining 
                  the confidentiality of your account and password.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payment and Fees</h2>
                <p className="text-gray-700 mb-4">
                  Fees for medical services are determined based on the services rendered and will be communicated to you prior to treatment.
                  We accept cash and mobile money payments.
                </p>
                <p className="text-gray-700">
                  You are responsible for all charges incurred under your account. We reserve the right to modify our fees 
                  at any time with prior notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
                <p className="text-gray-700 mb-4">
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect 
                  your personal and medical information.
                </p>
                <p className="text-gray-700">
                  We implement appropriate security measures to protect your information but cannot guarantee absolute security 
                  of data transmission over the internet.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
                <p className="text-gray-700 mb-4">
                  All content on this website, including text, graphics, logos, images, and software, is the property of 
                  MedRise Medical Centre or its content suppliers and is protected by copyright laws.
                </p>
                <p className="text-gray-700">
                  You may not reproduce, distribute, or create derivative works without our express written permission.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-700 mb-4">
                  To the fullest extent permitted by law, MedRise Medical Centre shall not be liable for any indirect, incidental, 
                  special, or consequential damages arising from your use of our services.
                </p>
                <p className="text-gray-700">
                  We are not liable for any loss or damage resulting from your inability to access our website or services, 
                  or from any interruption or suspension of our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Medical Disclaimer</h2>
                <p className="text-gray-700 mb-4">
                  The information provided on this website is for general informational purposes only and is not intended as 
                  medical advice.
                </p>
                <p className="text-gray-700">
                  Always seek the advice of your physician or other qualified healthcare provider with any questions you may 
                  have regarding a medical condition. Never disregard professional medical advice or delay seeking it because 
                  of something you have read on this website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Modifications to Terms</h2>
                <p className="text-gray-700">
                  We reserve the right to modify these terms at any time. Your continued use of our services after any changes 
                  constitutes acceptance of the modified terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
                <p className="text-gray-700">
                  These terms shall be governed by and construed in accordance with the laws of Uganda. Any disputes arising 
                  under these terms shall be subject to the exclusive jurisdiction of the courts of Uganda.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    <strong>MedRise Medical Centre</strong><br />
                    Lwadda A, Matugga<br />
                    Wakiso District, Uganda
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Phone:</strong> +256 770 775268 | +256 751 527730
                  </p>
                  <p className="text-gray-700">
                    <strong>Email:</strong> medrisemedicalcentre@gmail.com
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
