"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const features = [
  { number: "01", title: "Research Paper Discovery", description: "Find credible papers across disciplines with a focused search experience built for serious research.", icon: "↗" },
  { number: "02", title: "Smart Recommendations", description: "Surface related studies and meaningful connections that help you move beyond the first result.", icon: "✦" },
  { number: "03", title: "Literature Analysis", description: "Build a clearer view of the field by organizing themes, sources, and the questions still open.", icon: "⌁" },
];
const workflow = [["01", "Search", "Start with a topic, question, or key phrase."], ["02", "Discover", "Explore relevant papers and nearby research."], ["03", "Analyze", "Trace themes, methods, and research gaps."], ["04", "Organize", "Shape your findings into a focused review."]];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) router.push(`/papers?q=${encodeURIComponent(trimmedQuery)}`);
  };

  return <div className="site-shell">
    <header className="site-header"><Link className="brand" href="/" aria-label="ResearchLens home"><span className="brand-mark" aria-hidden="true">R</span><span>Research<span className="brand-accent">Lens</span></span></Link><nav className="main-nav" aria-label="Main navigation"><Link className="active" href="/">Home</Link><Link href="/papers">Explore Papers</Link><Link href="/literature">Literature Review</Link></nav><Link className="login-link" href="/login">Login <span aria-hidden="true">→</span></Link></header>
    <main id="top">
      <section className="hero-section" aria-labelledby="hero-heading"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> A clearer way to research</p><h1 id="hero-heading">Discover Research.<br /><em>Understand What&apos;s Next.</em></h1><p className="hero-description">Find the papers that matter, follow the ideas that connect them, and turn a scattered literature search into a confident next step.</p><form className="research-search" onSubmit={submitSearch}><span className="search-icon" aria-hidden="true">⌕</span><label className="sr-only" htmlFor="research-topic">Research topic</label><input id="research-topic" name="topic" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a research topic or question..." /><button type="submit">Explore Research <span aria-hidden="true">↗</span></button></form><p className="search-note"><span aria-hidden="true">✦</span> Search is ready for backend integration.</p></div><div className="hero-visual" aria-hidden="true"><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="visual-core">R<span>L</span></div><span className="visual-label label-top">CONNECTIONS</span><span className="visual-label label-right">IDEAS<br />IN MOTION</span><span className="visual-label label-bottom">01 — 04</span><div className="visual-dot dot-one" /><div className="visual-dot dot-two" /><div className="visual-dot dot-three" /></div></section>
      <section className="feature-section" aria-labelledby="feature-heading"><div className="section-heading"><p className="eyebrow"><span className="eyebrow-line" /> Built for depth</p><h2 id="feature-heading">From first search<br /><em>to full perspective.</em></h2></div><div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.number}><div className="feature-top"><span>{feature.number}</span><span className="feature-icon" aria-hidden="true">{feature.icon}</span></div><h3>{feature.title}</h3><p>{feature.description}</p><Link href={feature.number === "01" ? "/papers" : feature.number === "02" ? "/recommendations" : "/literature"}>Explore <span aria-hidden="true">↗</span></Link></article>)}</div></section>
      <section className="workflow-section" aria-labelledby="workflow-heading"><div className="workflow-intro"><p className="eyebrow"><span className="eyebrow-line" /> A focused workflow</p><h2 id="workflow-heading">Research,<br /><em>with momentum.</em></h2><p>Every strong review starts with a line of inquiry. ResearchLens helps you keep following it.</p></div><div className="workflow-list">{workflow.map(([number, title, description]) => <div className="workflow-step" key={number}><span className="step-number">{number}</span><div><h3>{title}</h3><p>{description}</p></div><span className="step-arrow" aria-hidden="true">↗</span></div>)}</div></section>
    </main>
    <footer className="site-footer"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">R</span><span>Research<span className="brand-accent">Lens</span></span></Link><p>Make sense of what&apos;s being discovered.</p><span className="footer-meta">© 2025 ResearchLens <span>·</span> Built for curious minds</span></footer>
  </div>;
}