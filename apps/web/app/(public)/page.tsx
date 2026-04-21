"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  ClipboardList,
  CreditCard,
  MessageCircle,
  FileText,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  Heart,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface AcademyProfile {
  name?: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export default function HomePage() {
  const [academy, setAcademy] = useState<AcademyProfile>({});

  useEffect(() => {
    const baseUrl = typeof window !== "undefined"
      ? `http://${window.location.hostname}:4000/api`
      : "http://localhost:4000/api";
    fetch(`${baseUrl}/settings/public/academy_profile`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.data) setAcademy(res.data);
      })
      .catch(() => {});
  }, []);

  const academyName = academy.name || "Creative Kids Academy";

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {academy.logo ? (
              <img
                src={academy.logo}
                alt="Academy logo"
                className="w-8 h-8 object-cover rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span className="font-bold text-lg text-foreground">{academyName}</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#programs" className="hover:text-foreground transition-colors">Programs</a>
            <a href="#why-us" className="hover:text-foreground transition-colors">Why Us</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-primary/10 via-background to-background py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Star className="w-3.5 h-3.5" />
            Trusted by 200+ families in our community
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight mb-6">
            Where Every Child&apos;s<br />
            <span className="text-primary">Story Begins</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
            Creative Kids Academy provides a nurturing, safe, and stimulating environment
            for children aged 2–5. Our digital-first platform keeps you connected to your
            child&apos;s day, every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Start Registration <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-base font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Parent Login
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
            {[
              { value: "200+", label: "Happy Families" },
              { value: "15+", label: "Years Experience" },
              { value: "3", label: "Age-Group Rooms" },
              { value: "98%", label: "Parent Satisfaction" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">Our Mission</div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Raising Curious, Confident Kids
            </h2>
            <p className="text-muted-foreground mb-4">
              At Creative Kids Academy, we believe every child is born with an innate curiosity and
              joy for learning. Our mission is to cultivate that natural spark in a safe, loving
              environment that fosters emotional, social, and cognitive growth.
            </p>
            <p className="text-muted-foreground mb-6">
              Our play-based curriculum is thoughtfully designed to meet the developmental
              milestones of each age group, with experienced educators who treat every child
              as an individual.
            </p>
            <ul className="space-y-3">
              {[
                "Play-based, child-led learning philosophy",
                "Low child-to-staff ratios for personalized attention",
                "Safe, stimulating indoor and outdoor spaces",
                "Transparent communication with families",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 p-8 flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Warm & Welcoming</h3>
                <p className="text-sm text-muted-foreground">We create a home-away-from-home atmosphere where children feel secure and loved.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Community Focused</h3>
                <p className="text-sm text-muted-foreground">We partner with parents to build a strong, supportive community around every child.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Excellence in Care</h3>
                <p className="text-sm text-muted-foreground">Our staff hold early childhood education credentials and undergo ongoing training.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">Our Programs</div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Age-Appropriate Learning Rooms</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Each classroom is designed specifically for the developmental stage of the children it serves.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sunflower Room",
                ages: "Ages 2–3",
                emoji: "🌻",
                color: "from-yellow-100 to-yellow-50 border-yellow-200",
                accent: "text-yellow-600",
                description:
                  "A gentle, nurturing space where toddlers build trust, social awareness, and language skills through play and exploration.",
                features: ["Sensory play stations", "Circle time & storytime", "Music & movement", "Potty training support"],
              },
              {
                name: "Butterfly Room",
                ages: "Ages 3–4",
                emoji: "🦋",
                color: "from-purple-100 to-purple-50 border-purple-200",
                accent: "text-purple-600",
                description:
                  "Budding independence blossoms here as children explore creativity, pre-literacy, and collaborative play.",
                features: ["Art & craft projects", "Pre-reading activities", "Collaborative games", "Nature exploration"],
              },
              {
                name: "Rainbow Room",
                ages: "Ages 4–5",
                emoji: "🌈",
                color: "from-blue-100 to-blue-50 border-blue-200",
                accent: "text-blue-600",
                description:
                  "School-readiness skills flourish as children tackle structured learning, problem-solving, and critical thinking.",
                features: ["Phonics & early math", "STEM discovery", "Leadership activities", "Kindergarten readiness"],
              },
            ].map((room) => (
              <div
                key={room.name}
                className={`rounded-2xl bg-gradient-to-b ${room.color} border p-6 flex flex-col`}
              >
                <div className="text-4xl mb-4">{room.emoji}</div>
                <div className={`text-xs font-semibold uppercase tracking-wide ${room.accent} mb-1`}>
                  {room.ages}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{room.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{room.description}</p>
                <ul className="space-y-2 mt-auto">
                  {room.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">Why Choose Us</div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need, In One Place</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our digital management platform keeps parents informed and admin streamlined.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Secure Digital Records",
                desc: "All child records, medical notes, and documents are stored securely with role-based access control.",
              },
              {
                icon: ClipboardList,
                title: "Digital Enrollment",
                desc: "Register your child online, upload documents, and track your application status in real time.",
              },
              {
                icon: CreditCard,
                title: "Online Payments",
                desc: "Pay tuition, view invoices, and download receipts directly from your parent portal.",
              },
              {
                icon: MessageCircle,
                title: "Real-Time Communication",
                desc: "Send and receive messages from staff instantly. Stay informed without a phone call.",
              },
              {
                icon: FileText,
                title: "Daily Reports",
                desc: "Get detailed daily updates on meals, naps, mood, and activities — with photos from staff.",
              },
              {
                icon: Star,
                title: "Qualified & Caring Staff",
                desc: "All educators hold ECE certifications, undergo background checks, and receive ongoing training.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl bg-card border border-border p-6">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">Testimonials</div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Hear From Our Families</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah M.",
                role: "Parent of Emma, age 3",
                quote:
                  "The daily reports and real-time updates give me such peace of mind at work. I know exactly what Emma is up to every day!",
              },
              {
                name: "James & Priya R.",
                role: "Parents of Noah, age 4",
                quote:
                  "The Butterfly Room teachers are incredible. Noah has grown so much in confidence and social skills since he started here.",
              },
              {
                name: "Linda C.",
                role: "Parent of Sofia, age 5",
                quote:
                  "The online enrollment and payment system is a game changer. No more paper forms or writing checks — everything is digital and fast.",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-xl bg-card border border-border p-6 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic mb-4 flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold text-foreground text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Join Our Family?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Spaces fill up fast. Register online today and our admissions team will be in touch within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-background px-6 py-3 text-base font-semibold text-primary hover:bg-background/90 transition-colors"
            >
              Register Now <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-primary-foreground/30 bg-transparent px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Contact / Footer */}
      <footer id="contact" className="bg-foreground text-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {academy.logo ? (
                <img
                  src={academy.logo}
                  alt="Academy logo"
                  className="w-8 h-8 object-cover rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <span className="font-bold text-lg">{academyName}</span>
            </div>
            <p className="text-background/70 text-sm mb-4 max-w-xs">
              Nurturing young minds since 2010. A safe, joyful place where children grow, learn, and thrive.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-background/60">Contact</h4>
            <ul className="space-y-3 text-sm text-background/80">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                {[academy.address, academy.city, academy.state, academy.zipCode].filter(Boolean).join(", ") || "123 Sunshine Lane, Springfield, IL 62701"}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                {academy.phone || "(555) 123-4567"}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                {academy.email || "hello@creativekidsacademy.com"}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-background/60">Hours</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                Mon–Fri: 7:00 AM – 6:00 PM
              </li>
              <li className="pl-6 text-background/60">Saturday: Closed</li>
              <li className="pl-6 text-background/60">Sunday: Closed</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-background/10 text-center text-xs text-background/40">
          © {new Date().getFullYear()} {academyName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
