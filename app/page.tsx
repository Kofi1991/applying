import Link from "next/link";

export default function Home() {
  return (
    <>
      <section style={{ padding: "32px 0 8px" }}>
        <h1>Wake up to roles that actually fit your CV.</h1>
        <p className="lead">
          ZapApply searches job boards and company careers pages every morning, scores each role against your CV,
          and emails you a shortlist with direct links to apply.
        </p>
        <p style={{ marginTop: 24 }}>
          <Link className="btn" href="/login">Get started</Link>
        </p>
      </section>

      <h2>How it works</h2>
      <ol className="steps">
        <li><div><b>Tell us what you want.</b> Upload your CV and set job titles, location, office days, contract or permanent, and pay.</div></li>
        <li><div><b>The Search agent looks every day</b> at the time you choose, and skips anything you've already seen.</div></li>
        <li><div><b>The Reviewer scores each role</b> against your CV out of 100 and drops weak matches.</div></li>
        <li><div><b>You get a shortlist</b> by email with a PDF. Roles scoring 85+ are flagged as very suitable.</div></li>
      </ol>

      <h2>Your data</h2>
      <p className="hint" style={{ fontSize: 15 }}>
        Your CV is stored privately and is only read to find and score roles for you. You can delete your account and everything in it from your profile.
      </p>
    </>
  );
}
