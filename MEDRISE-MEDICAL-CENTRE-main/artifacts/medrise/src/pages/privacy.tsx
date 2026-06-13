import { Helmet } from 'react-helmet-async';

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | MedRise Medical Centre</title>
        <meta name="description" content="Privacy Policy and Medical Disclaimer for MedRise Medical Centre. Learn how we protect your personal and medical information." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-blue-900 px-6 py-8">
              <h1 className="text-3xl font-bold text-white">Privacy Policy & Medical Disclaimer</h1>
              <p className="text-blue-200 mt-2">Last Updated: June 13, 2026</p>
            </div>
            
            <div className="px-6 py-8 prose prose-blue max-w-none">

        {/* Privacy Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary mb-4 pb-2 border-b">Privacy Policy</h2>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold mb-2">1. Who We Are</h3>
              <p>
                MedRise Medical Centre ("we", "our", or "us") is a registered medical facility
                located at Lwadda A, Matugga, Wakiso District, Uganda. We are committed to
                protecting your personal and medical information in accordance with Ugandan law and
                international best practices.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">2. Information We Collect</h3>
              <p className="mb-2">We collect the following categories of information:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Personal identifiers:</strong> Full name, date of birth, national ID,
                  phone number, email address, and physical address.
                </li>
                <li>
                  <strong>Medical information:</strong> Medical history, diagnoses, prescriptions,
                  laboratory results, vital signs, and clinical notes recorded during consultations.
                </li>
                <li>
                  <strong>Appointment information:</strong> Booking details, visit dates, and
                  department preferences.
                </li>
                <li>
                  <strong>Billing information:</strong> Invoice details and payment records (we do
                  not store card numbers).
                </li>
                <li>
                  <strong>Website usage data:</strong> Browser type, pages visited, and anonymised
                  usage analytics.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">3. How We Use Your Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>To deliver and coordinate your medical care and treatment.</li>
                <li>To manage appointments, billing, and medical records.</li>
                <li>To send appointment reminders and important health notifications.</li>
                <li>To comply with legal and regulatory obligations under Ugandan law.</li>
                <li>To improve our services through anonymised analytics.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">4. Who We Share Your Information With</h3>
              <p className="mb-2">
                We do <strong>not</strong> sell your personal data. We may share information only
                with:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Medical staff within MedRise who are involved in your care.</li>
                <li>Authorised referral partners or specialist consultants, with your consent.</li>
                <li>
                  Government health authorities where required by law (e.g., notifiable disease
                  reporting).
                </li>
                <li>
                  Technology providers who process data on our behalf under strict data processing
                  agreements.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">5. Data Security</h3>
              <p>
                Your data is stored on secure, encrypted servers. Access is restricted to authorised
                personnel only, authenticated via secure login systems. All data transmitted between
                your browser and our servers is encrypted using HTTPS/TLS. We maintain an audit
                trail of all data access and changes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">6. Data Retention</h3>
              <p>
                Medical records are retained for a minimum of 10 years in accordance with Ugandan
                health regulations. Appointment and billing records are retained for 7 years. You
                may request deletion of non-medical personal data by contacting us.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">7. Your Rights</h3>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access a copy of your personal and medical records held by us.</li>
                <li>Request correction of inaccurate personal data.</li>
                <li>Request deletion of personal data where legally permitted.</li>
                <li>Withdraw consent for non-essential communications at any time.</li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, please contact us at the details below.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">8. Cookies</h3>
              <p>
                Our website uses only functional cookies necessary for the site to operate. We do
                not use tracking or advertising cookies. No cookie consent banner is required as we
                do not use non-essential cookies.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">9. Contact Us</h3>
              <p>
                For any privacy-related queries or to exercise your rights, contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-2">
                <p className="text-gray-700 mb-2">
                  <strong>MedRise Medical Centre</strong><br />
                  Lwadda A, Matugga<br />
                  Wakiso District, Uganda
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> medrisemedicalcentre@gmail.com
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Phone:</strong> +256 770 775268 | +256 751 527730
                </p>
                <p className="text-gray-700">
                  <strong>WhatsApp:</strong> https://wa.me/256751527730
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Medical Disclaimer */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-primary mb-4 pb-2 border-b">
            Medical Disclaimer
          </h2>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-semibold text-amber-800 mb-1">Important Notice</p>
              <p className="text-amber-700 text-sm">
                The information provided on this website is for general informational purposes only
                and does not constitute professional medical advice, diagnosis, or treatment.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                1. Not a Substitute for Professional Medical Care
              </h3>
              <p>
                The content on this website — including any health-related articles, service
                descriptions, or information about conditions — is intended for general awareness
                only. It is not a substitute for professional medical advice, examination,
                diagnosis, or treatment provided by a qualified and licensed healthcare
                professional.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">2. Emergency Situations</h3>
              <p>
                If you are experiencing a medical emergency, do not rely on this website. Call
                emergency services immediately or proceed to your nearest emergency facility.
                MedRise Medical Centre provides 24/7 emergency care — call us or come to our
                facility directly.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">3. Clinical Records System</h3>
              <p>
                The MedRise clinical management system is an internal tool used by licensed
                healthcare professionals to manage patient care. All clinical decisions are made by
                qualified medical practitioners and are not automated by the software system. The
                system supports — it does not replace — the professional judgment of our clinical
                staff.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">4. Accuracy of Information</h3>
              <p>
                While we strive to keep all information on this website accurate and up to date,
                medical knowledge evolves continuously. MedRise Medical Centre makes no warranty,
                express or implied, about the completeness, accuracy, reliability, or suitability of
                the information on this website for any particular purpose.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">5. Always Seek Professional Advice</h3>
              <p>
                Never disregard professional medical advice or delay seeking it because of something
                you have read on this website. Always consult a qualified healthcare provider for
                diagnosis and treatment of any medical condition.
              </p>
            </div>
          </div>
        </section>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
