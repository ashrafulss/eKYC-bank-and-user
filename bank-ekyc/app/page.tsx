import LoginForm from "./components/LoginForm";

export default function Home() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left info */}
        <div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Bank Admin Dashboard
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Securely access the eKYC management portal to review, verify, and
            manage customer applications.
          </p>

          <div className="space-y-4">
            {[
              {
                title: "Review Applications",
                desc: "View and verify submitted eKYC applications in real time",
              },
              {
                title: "Approve or Reject",
                desc: "Take action on pending KYC requests with reviewer notes",
              },
              {
                title: "Audit Logs",
                desc: "Full history of all actions taken by bank staff",
              },
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — login form component */}
        <LoginForm />
      </div>
    </section>
  );
}
