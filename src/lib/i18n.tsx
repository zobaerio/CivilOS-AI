import React, { createContext, useContext, useState, useCallback } from "react";

export type Lang = "en" | "bn";

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  currency: (n: number) => string;
  fmt: (n: number) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  // Navbar
  "nav.home": { en: "Home", bn: "হোম" },
  "nav.upload": { en: "Upload Design", bn: "ডিজাইন আপলোড" },
  "nav.demo": { en: "Demo Estimate", bn: "ডেমো এস্টিমেট" },
  "nav.about": { en: "About", bn: "সম্পর্কে" },
  "nav.contact": { en: "Contact", bn: "যোগাযোগ" },
  "nav.login": { en: "Login", bn: "লগইন" },
  "nav.getEstimate": { en: "Get Estimate", bn: "এস্টিমেট নিন" },

  // Hero
  "hero.badge": { en: "AI-Powered Construction Estimation", bn: "এআই-চালিত নির্মাণ এস্টিমেশন" },
  "hero.title": { en: "Upload Your House Design & Get Full Construction Estimate Instantly", bn: "আপনার বাড়ির ডিজাইন আপলোড করুন এবং সম্পূর্ণ নির্মাণ এস্টিমেট তাৎক্ষণিকভাবে পান" },
  "hero.subtitle": { en: "Smart AI-powered building estimation system for house owners, civil engineers, architects, and contractors.", bn: "বাড়ির মালিক, সিভিল ইঞ্জিনিয়ার, আর্কিটেক্ট এবং ঠিকাদারদের জন্য স্মার্ট এআই-চালিত বিল্ডিং এস্টিমেশন সিস্টেম।" },
  "hero.upload": { en: "Upload Design", bn: "ডিজাইন আপলোড" },
  "hero.tryDemo": { en: "Try Demo", bn: "ডেমো দেখুন" },
  "hero.free": { en: "✓ Free to try", bn: "✓ বিনামূল্যে চেষ্টা করুন" },
  "hero.instant": { en: "✓ Instant results", bn: "✓ তাৎক্ষণিক ফলাফল" },
  "hero.pdf": { en: "✓ PDF reports", bn: "✓ পিডিএফ রিপোর্ট" },

  // Features
  "features.title": { en: "Complete Construction Estimation", bn: "সম্পূর্ণ নির্মাণ এস্টিমেশন" },
  "features.subtitle": { en: "Get every detail you need — from foundation to finishing — in one intelligent platform.", bn: "ফাউন্ডেশন থেকে ফিনিশিং — প্রতিটি বিবরণ একটি বুদ্ধিমান প্ল্যাটফর্মে পান।" },
  "features.areaCalc": { en: "Area Calculation", bn: "এরিয়া গণনা" },
  "features.areaCalcDesc": { en: "Total built-up, room-wise, slab, and wall areas", bn: "মোট বিল্ট-আপ, রুমওয়াইজ, স্ল্যাব এবং দেয়ালের এরিয়া" },
  "features.material": { en: "Material Estimate", bn: "মালামাল এস্টিমেট" },
  "features.materialDesc": { en: "Cement, sand, bricks, steel, stone & more", bn: "সিমেন্ট, বালি, ইট, রড, পাথর ও আরও" },
  "features.labor": { en: "Labor Cost", bn: "শ্রমিক খরচ" },
  "features.laborDesc": { en: "Mason, carpenter, electrician, plumber costs", bn: "রাজমিস্ত্রি, কাঠমিস্ত্রি, ইলেকট্রিশিয়ান, প্লাম্বার খরচ" },
  "features.finishing": { en: "Finishing Estimate", bn: "ফিনিশিং এস্টিমেট" },
  "features.finishingDesc": { en: "Paint, tiles, flooring, polish, false ceiling", bn: "পেইন্ট, টাইলস, ফ্লোরিং, পলিশ, ফলস সিলিং" },
  "features.electrical": { en: "Electrical Estimate", bn: "ইলেকট্রিক্যাল এস্টিমেট" },
  "features.electricalDesc": { en: "Wiring points, switches, DB box, fixtures", bn: "ওয়্যারিং পয়েন্ট, সুইচ, ডিবি বক্স, ফিক্সচার" },
  "features.plumbing": { en: "Plumbing Estimate", bn: "প্লাম্বিং এস্টিমেট" },
  "features.plumbingDesc": { en: "Pipe length, fittings, water tank sizing", bn: "পাইপ দৈর্ঘ্য, ফিটিংস, পানির ট্যাংক সাইজিং" },
  "features.roomwise": { en: "Room-wise Details", bn: "রুমওয়াইজ বিবরণ" },
  "features.roomwiseDesc": { en: "Per-room area, finish, doors, windows", bn: "প্রতি রুমের এরিয়া, ফিনিশ, দরজা, জানালা" },
  "features.pdfReport": { en: "PDF Report", bn: "পিডিএফ রিপোর্ট" },
  "features.pdfReportDesc": { en: "Downloadable detailed estimate report", bn: "ডাউনলোডযোগ্য বিস্তারিত এস্টিমেট রিপোর্ট" },
  "features.aiSuggestions": { en: "AI Suggestions", bn: "এআই পরামর্শ" },
  "features.aiSuggestionsDesc": { en: "Cost-saving & optimization recommendations", bn: "খরচ সাশ্রয় ও অপটিমাইজেশন পরামর্শ" },
  "features.costBreakdown": { en: "Cost Breakdown", bn: "খরচের বিশ্লেষণ" },
  "features.costBreakdownDesc": { en: "Item-wise quantity, rate & total amount", bn: "আইটেমওয়াইজ পরিমাণ, দর ও মোট পরিমাণ" },
  "features.multiFloor": { en: "Multi-Floor", bn: "মাল্টি-ফ্লোর" },
  "features.multiFloorDesc": { en: "Single, duplex & multi-storied buildings", bn: "সিঙ্গেল, ডুপ্লেক্স ও মাল্টি-তলা ভবন" },
  "features.projectTypes": { en: "Project Types", bn: "প্রকল্পের ধরন" },
  "features.projectTypesDesc": { en: "Residential, commercial, shop-home combo", bn: "আবাসিক, বাণিজ্যিক, দোকান-বাসা কম্বো" },

  // How it works
  "how.title": { en: "How It Works", bn: "কিভাবে কাজ করে" },
  "how.subtitle": { en: "Four simple steps to your construction estimate", bn: "চারটি সহজ ধাপে আপনার নির্মাণ এস্টিমেট" },
  "how.step1.title": { en: "Upload Design", bn: "ডিজাইন আপলোড" },
  "how.step1.desc": { en: "Upload your floor plan, blueprint, or house design image/PDF.", bn: "আপনার ফ্লোর প্ল্যান, ব্লুপ্রিন্ট বা বাড়ির ডিজাইন ছবি/পিডিএফ আপলোড করুন।" },
  "how.step2.title": { en: "Enter Details", bn: "বিবরণ দিন" },
  "how.step2.desc": { en: "Provide dimensions, floors, material quality, and other preferences.", bn: "মাপ, তলা, মালামালের মান এবং অন্যান্য পছন্দ দিন।" },
  "how.step3.title": { en: "Get Estimate", bn: "এস্টিমেট পান" },
  "how.step3.desc": { en: "AI analyzes your design and generates a complete cost breakdown.", bn: "এআই আপনার ডিজাইন বিশ্লেষণ করে সম্পূর্ণ খরচের বিশ্লেষণ তৈরি করে।" },
  "how.step4.title": { en: "Download Report", bn: "রিপোর্ট ডাউনলোড" },
  "how.step4.desc": { en: "Download a detailed PDF report with all calculations.", bn: "সমস্ত হিসাব সহ একটি বিস্তারিত পিডিএফ রিপোর্ট ডাউনলোড করুন।" },

  // Testimonials
  "testimonials.title": { en: "Trusted by Professionals", bn: "পেশাদারদের বিশ্বস্ত" },
  "testimonial.1.name": { en: "Arif Rahman", bn: "আরিফ রহমান" },
  "testimonial.1.role": { en: "Civil Engineer", bn: "সিভিল ইঞ্জিনিয়ার" },
  "testimonial.1.text": { en: "This tool saves me hours of manual BOQ calculation. The estimates are surprisingly close to my detailed analysis.", bn: "এই টুলটি আমার ম্যানুয়াল BOQ হিসাবে ঘণ্টার পর ঘণ্টা সময় বাঁচায়। এস্টিমেটগুলো আমার বিস্তারিত বিশ্লেষণের কাছাকাছি।" },
  "testimonial.2.name": { en: "Fatima Akter", bn: "ফাতিমা আক্তার" },
  "testimonial.2.role": { en: "Homeowner", bn: "বাড়ির মালিক" },
  "testimonial.2.text": { en: "I could finally understand the construction costs before talking to contractors. Very user-friendly!", bn: "ঠিকাদারদের সাথে কথা বলার আগেই নির্মাণ খরচ বুঝতে পারলাম। খুবই ব্যবহারবান্ধব!" },
  "testimonial.3.name": { en: "Kamal Hossain", bn: "কামাল হোসেন" },
  "testimonial.3.role": { en: "Contractor", bn: "ঠিকাদার" },
  "testimonial.3.text": { en: "I use this for quick client proposals. The PDF reports look professional and detailed.", bn: "আমি এটি দ্রুত ক্লায়েন্ট প্রস্তাবের জন্য ব্যবহার করি। পিডিএফ রিপোর্টগুলো পেশাদার এবং বিস্তারিত।" },

  // FAQ
  "faq.title": { en: "Frequently Asked Questions", bn: "সচরাচর জিজ্ঞাসিত প্রশ্নাবলী" },
  "faq.1.q": { en: "How accurate is the estimate?", bn: "এস্টিমেট কতটুকু সঠিক?" },
  "faq.1.a": { en: "The system provides approximate estimates based on standard civil engineering formulas. For exact BOQ, consult a licensed engineer.", bn: "সিস্টেমটি প্রচলিত সিভিল ইঞ্জিনিয়ারিং সূত্রের উপর ভিত্তি করে আনুমানিক এস্টিমেট দেয়। সঠিক BOQ এর জন্য লাইসেন্সপ্রাপ্ত ইঞ্জিনিয়ারের পরামর্শ নিন।" },
  "faq.2.q": { en: "What file formats are supported?", bn: "কোন ফাইল ফরম্যাট সাপোর্ট করে?" },
  "faq.2.a": { en: "JPG, PNG, PDF, and scanned blueprints. AutoCAD-exported images and PDFs also work.", bn: "JPG, PNG, PDF এবং স্ক্যান করা ব্লুপ্রিন্ট। AutoCAD এক্সপোর্ট করা ছবি এবং PDF ও কাজ করে।" },
  "faq.3.q": { en: "Can I estimate multi-storied buildings?", bn: "মাল্টি-তলা বিল্ডিং এস্টিমেট করা যায়?" },
  "faq.3.a": { en: "Yes! You can specify the number of floors and the system will calculate accordingly.", bn: "হ্যাঁ! আপনি তলার সংখ্যা নির্ধারণ করতে পারেন এবং সিস্টেম সেই অনুযায়ী হিসাব করবে।" },
  "faq.4.q": { en: "Is my uploaded data secure?", bn: "আমার আপলোড করা ডেটা কি নিরাপদ?" },
  "faq.4.a": { en: "Yes, all uploads are encrypted and processed securely. We never share your data.", bn: "হ্যাঁ, সমস্ত আপলোড এনক্রিপ্ট করা এবং নিরাপদে প্রক্রিয়া করা হয়। আমরা কখনো আপনার ডেটা শেয়ার করি না।" },
  "faq.5.q": { en: "Can I adjust material prices?", bn: "মালামালের দাম কি পরিবর্তন করা যায়?" },
  "faq.5.a": { en: "Absolutely. The estimate dashboard includes sliders for material rates, labor costs, and other factors.", bn: "অবশ্যই। এস্টিমেট ড্যাশবোর্ডে মালামালের দর, শ্রমিক খরচ এবং অন্যান্য ফ্যাক্টরের জন্য স্লাইডার আছে।" },
  "faq.6.q": { en: "Do I need to provide dimensions?", bn: "আমাকে কি মাপ দিতে হবে?" },
  "faq.6.a": { en: "If the uploaded drawing has visible dimensions, they'll be used. Otherwise, you'll be asked to enter plot size and key measurements.", bn: "আপলোড করা ড্রইংয়ে মাপ দৃশ্যমান থাকলে সেগুলো ব্যবহার হবে। অন্যথায়, প্লটের আকার এবং মূল মাপ দিতে বলা হবে।" },
  "faq.7.q": { en: "Does it follow BNBC 2022 code?", bn: "এটা কি BNBC 2022 কোড মেনে চলে?" },
  "faq.7.a": { en: "Yes. Dead, Live, Wind, Snow, Earth Pressure, Water and Earthquake loads are computed per BNBC 2022 with full clause references and factored combinations.", bn: "হ্যাঁ। Dead, Live, Wind, Snow, Earth Pressure, Water এবং Earthquake লোড সম্পূর্ণ BNBC 2022 ক্লজ রেফারেন্স ও factored কম্বিনেশন সহ হিসাব হয়।" },
  "faq.8.q": { en: "Are the market rates real-time?", bn: "মার্কেট রেট কি রিয়েল-টাইম?" },
  "faq.8.a": { en: "Yes — district-wise daily Bangladesh rates for Cement, Steel, Brick, Sand, Stone Chips and Labor auto-update and recalculate the BOQ.", bn: "হ্যাঁ — Cement, Steel, Brick, Sand, Stone Chips এবং Labor-এর জেলা-ভিত্তিক দৈনিক রেট অটো আপডেট হয় ও BOQ পুনরায় ক্যালকুলেট হয়।" },
  "faq.9.q": { en: "Can I export the estimate as PDF?", bn: "এস্টিমেট কি PDF আকারে এক্সপোর্ট করা যায়?" },
  "faq.9.a": { en: "Yes. Full BOQ, load report, structural design and quotation can be exported as a professional PDF.", bn: "হ্যাঁ। সম্পূর্ণ BOQ, লোড রিপোর্ট, স্ট্রাকচারাল ডিজাইন ও কোটেশন প্রফেশনাল PDF আকারে এক্সপোর্ট করা যায়।" },
  "faq.10.q": { en: "Do you store my drawings?", bn: "আমার ড্রইং কি সংরক্ষণ করা হয়?" },
  "faq.10.a": { en: "Drawings are processed securely and only saved to your account if you choose to save the project. Nothing is shared with third parties.", bn: "ড্রইং নিরাপদে প্রক্রিয়া হয় এবং আপনি প্রজেক্ট সেভ করলে শুধু আপনার অ্যাকাউন্টে থাকে। কোনো তৃতীয় পক্ষের সাথে শেয়ার হয় না।" },
  "faq.11.q": { en: "What's the maximum file size?", bn: "সর্বোচ্চ ফাইল সাইজ কত?" },
  "faq.11.a": { en: "Up to 20 MB per drawing. For larger CAD files, compress or export a flattened PDF.", bn: "প্রতি ড্রইং সর্বোচ্চ ২০ MB। বড় CAD ফাইলের জন্য কম্প্রেস বা ফ্ল্যাটেন্ড PDF এক্সপোর্ট করুন।" },
  "faq.12.q": { en: "Does it work for government / private projects?", bn: "এটা কি সরকারি / বেসরকারি কাজে চলে?" },
  "faq.12.a": { en: "Yes — both. Switch the project type to follow PWD 2022 schedule for government work or market-rate quotation for private projects.", bn: "হ্যাঁ — দুটোতেই। সরকারি কাজের জন্য PWD 2022 শিডিউল বা বেসরকারি প্রজেক্টের জন্য মার্কেট-রেট কোটেশন সিলেক্ট করুন।" },


  // Footer
  "footer.desc": { en: "AI-powered construction estimation for engineers, contractors, and homeowners.", bn: "ইঞ্জিনিয়ার, ঠিকাদার এবং বাড়ির মালিকদের জন্য এআই-চালিত নির্মাণ এস্টিমেশন।" },
  "footer.developedBy": { en: "Developed by Md Zobaer Hasan", bn: "ডেভেলপ করেছেন মোঃ জোবায়ের হাসান" },
  "footer.platform": { en: "Platform", bn: "প্ল্যাটফর্ম" },
  "footer.resources": { en: "Resources", bn: "রিসোর্স" },
  "footer.faq": { en: "FAQ", bn: "প্রশ্নোত্তর" },
  "footer.privacy": { en: "Privacy Policy", bn: "গোপনীয়তা নীতি" },
  "footer.terms": { en: "Terms of Service", bn: "সেবার শর্তাবলী" },
  "footer.contactTitle": { en: "Contact", bn: "যোগাযোগ" },
  "footer.copyright": { en: "© 2026 Smart House Estimate AI. All rights reserved.", bn: "© ২০২৬ স্মার্ট হাউজ এস্টিমেট এআই। সর্বস্বত্ব সংরক্ষিত।" },

  // Upload Page
  "upload.title": { en: "Upload Your Design", bn: "আপনার ডিজাইন আপলোড করুন" },
  "upload.subtitle": { en: "Upload a floor plan and provide project details for your estimate.", bn: "এস্টিমেটের জন্য ফ্লোর প্ল্যান আপলোড করুন এবং প্রকল্পের বিবরণ দিন।" },
  "upload.dragDrop": { en: "Drag & drop your design here", bn: "আপনার ডিজাইন এখানে টেনে আনুন" },
  "upload.browse": { en: "or click to browse — JPG, PNG, PDF supported", bn: "অথবা ব্রাউজ করতে ক্লিক করুন — JPG, PNG, PDF সাপোর্টেড" },
  "upload.remove": { en: "Remove", bn: "সরান" },
  "upload.projectDetails": { en: "Project Details", bn: "প্রকল্পের বিবরণ" },
  "upload.plotLength": { en: "Plot Length", bn: "প্লটের দৈর্ঘ্য" },
  "upload.plotWidth": { en: "Plot Width", bn: "প্লটের প্রস্থ" },
  "upload.unitSystem": { en: "Unit System", bn: "একক পদ্ধতি" },
  "upload.feet": { en: "Feet", bn: "ফুট" },
  "upload.meters": { en: "Meters", bn: "মিটার" },
  "upload.numFloors": { en: "Number of Floors", bn: "তলার সংখ্যা" },
  "upload.floorHeight": { en: "Floor Height", bn: "তলার উচ্চতা" },
  "upload.wallThickness": { en: "Wall Thickness (inch)", bn: "দেয়ালের পুরুত্ব (ইঞ্চি)" },
  "upload.projectType": { en: "Project Type", bn: "প্রকল্পের ধরন" },
  "upload.single": { en: "Single-Storied House", bn: "এক তলা বাড়ি" },
  "upload.duplex": { en: "Duplex House", bn: "ডুপ্লেক্স বাড়ি" },
  "upload.multi": { en: "Multi-Storied Building", bn: "বহুতল ভবন" },
  "upload.commercial": { en: "Commercial Building", bn: "বাণিজ্যিক ভবন" },
  "upload.shopHome": { en: "Shop + Home Combo", bn: "দোকান + বাসা কম্বো" },
  "upload.quality": { en: "Construction Quality", bn: "নির্মাণ মান" },
  "upload.economy": { en: "Economy", bn: "ইকোনমি" },
  "upload.standard": { en: "Standard", bn: "স্ট্যান্ডার্ড" },
  "upload.premium": { en: "Premium", bn: "প্রিমিয়াম" },
  "upload.foundation": { en: "Foundation Type", bn: "ভিত্তির ধরন" },
  "upload.strip": { en: "Strip Foundation", bn: "স্ট্রিপ ফাউন্ডেশন" },
  "upload.isolated": { en: "Isolated Footing", bn: "আইসোলেটেড ফুটিং" },
  "upload.raft": { en: "Raft Foundation", bn: "র‍্যাফট ফাউন্ডেশন" },
  "upload.pile": { en: "Pile Foundation", bn: "পাইল ফাউন্ডেশন" },
  "upload.roofType": { en: "Roof / Slab Type", bn: "ছাদ / স্ল্যাব ধরন" },
  "upload.rccSlab": { en: "RCC Slab", bn: "আরসিসি স্ল্যাব" },
  "upload.tinShade": { en: "Tin Shade", bn: "টিনের চালা" },
  "upload.flatRoof": { en: "Flat Roof", bn: "ফ্ল্যাট রুফ" },
  "upload.analyze": { en: "Analyze Design", bn: "ডিজাইন বিশ্লেষণ করুন" },

  // Estimate Page
  "est.downloadPdf": { en: "Download PDF Report", bn: "পিডিএফ রিপোর্ট ডাউনলোড" },
  "est.totalArea": { en: "Total Area", bn: "মোট এরিয়া" },
  "est.totalCost": { en: "Total Cost", bn: "মোট খরচ" },
  "est.costSqft": { en: "Cost/sqft", bn: "খরচ/বর্গফুট" },
  "est.duration": { en: "Est. Duration", bn: "আনুমানিক সময়" },
  "est.months": { en: "months", bn: "মাস" },
  "est.costDist": { en: "Cost Distribution", bn: "খরচ বিন্যাস" },
  "est.catCost": { en: "Category-wise Cost", bn: "বিভাগওয়াইজ খরচ" },
  "est.civilWork": { en: "Civil Work Estimate", bn: "সিভিল ওয়ার্ক এস্টিমেট" },
  "est.item": { en: "Item", bn: "আইটেম" },
  "est.amount": { en: "Amount", bn: "পরিমাণ" },
  "est.materialEst": { en: "Material Estimate", bn: "মালামাল এস্টিমেট" },
  "est.material": { en: "Material", bn: "মালামাল" },
  "est.qty": { en: "Qty", bn: "পরিমাণ" },
  "est.unit": { en: "Unit", bn: "একক" },
  "est.rate": { en: "Rate", bn: "দর" },
  "est.total": { en: "Total", bn: "মোট" },
  "est.laborEst": { en: "Labor Estimate", bn: "শ্রমিক এস্টিমেট" },
  "est.laborType": { en: "Labor Type", bn: "শ্রমিকের ধরন" },
  "est.days": { en: "Days", bn: "দিন" },
  "est.rateDay": { en: "Rate/Day", bn: "দর/দিন" },
  "est.finishing": { en: "Finishing", bn: "ফিনিশিং" },
  "est.electrical": { en: "Electrical", bn: "ইলেকট্রিক্যাল" },
  "est.plumbing": { en: "Plumbing", bn: "প্লাম্বিং" },
  "est.roomwise": { en: "Room-wise Details", bn: "রুমওয়াইজ বিবরণ" },
  "est.room": { en: "Room", bn: "রুম" },
  "est.length": { en: "L (ft)", bn: "দৈ (ফু)" },
  "est.width": { en: "W (ft)", bn: "প্র (ফু)" },
  "est.area": { en: "Area (sqft)", bn: "এরিয়া (বর্গফু)" },
  "est.doors": { en: "Doors", bn: "দরজা" },
  "est.windows": { en: "Windows", bn: "জানালা" },
  "est.aiSuggestions": { en: "AI Suggestions", bn: "এআই পরামর্শ" },
  "est.disclaimer": { en: "⚠️ This is an approximate estimate based on standard civil engineering formulas. Final structural design and BOQ should be verified by a licensed civil engineer.", bn: "⚠️ এটি প্রচলিত সিভিল ইঞ্জিনিয়ারিং সূত্রের উপর ভিত্তি করে একটি আনুমানিক এস্টিমেট। চূড়ান্ত কাঠামোগত ডিজাইন এবং BOQ একজন লাইসেন্সপ্রাপ্ত সিভিল ইঞ্জিনিয়ার দ্বারা যাচাই করা উচিত।" },
  "est.floor": { en: "Floor(s)", bn: "তলা" },
  "est.quality": { en: "Quality", bn: "মান" },

  // About
  "about.title": { en: "About Smart House Estimate AI", bn: "স্মার্ট হাউজ এস্টিমেট এআই সম্পর্কে" },
  "about.p1": { en: "Smart House Estimate AI is an intelligent construction estimation platform built for civil engineers, contractors, architects, students, and homeowners. Upload your house design or floor plan and get a comprehensive cost breakdown instantly.", bn: "স্মার্ট হাউজ এস্টিমেট এআই সিভিল ইঞ্জিনিয়ার, ঠিকাদার, আর্কিটেক্ট, ছাত্র এবং বাড়ির মালিকদের জন্য তৈরি একটি বুদ্ধিমান নির্মাণ এস্টিমেশন প্ল্যাটফর্ম। আপনার বাড়ির ডিজাইন বা ফ্লোর প্ল্যান আপলোড করুন এবং তাৎক্ষণিকভাবে সম্পূর্ণ খরচের বিশ্লেষণ পান।" },
  "about.p2": { en: "Our AI-powered system analyzes building drawings to generate material quantities, labor costs, finishing estimates, and more — helping you plan and budget your construction project with confidence.", bn: "আমাদের এআই-চালিত সিস্টেম বিল্ডিং ড্রইং বিশ্লেষণ করে মালামালের পরিমাণ, শ্রমিক খরচ, ফিনিশিং এস্টিমেট এবং আরও অনেক কিছু তৈরি করে — আপনাকে আত্মবিশ্বাসের সাথে আপনার নির্মাণ প্রকল্প পরিকল্পনা ও বাজেট করতে সাহায্য করে।" },
  "about.developedBy": { en: "Developed by", bn: "ডেভেলপ করেছেন" },
  "about.devName": { en: "Md Zobaer Hasan", bn: "মোঃ জোবায়ের হাসান" },
  "about.devRole": { en: "Civil Engineering Student & Construction Technology Enthusiast", bn: "সিভিল ইঞ্জিনিয়ারিং শিক্ষার্থী ও কনস্ট্রাকশন টেকনোলজি উৎসাহী" },

  // Contact
  "contact.title": { en: "Contact Us", bn: "যোগাযোগ করুন" },
  "contact.subtitle": { en: "Have questions or feedback? We'd love to hear from you.", bn: "প্রশ্ন বা মতামত আছে? আমরা আপনার কথা শুনতে চাই।" },
  "contact.name": { en: "Your Name", bn: "আপনার নাম" },
  "contact.email": { en: "Email", bn: "ইমেইল" },
  "contact.subject": { en: "Subject", bn: "বিষয়" },
  "contact.message": { en: "Your message...", bn: "আপনার বার্তা..." },
  "contact.send": { en: "Send Message", bn: "বার্তা পাঠান" },
  "contact.sent": { en: "Message Sent!", bn: "বার্তা পাঠানো হয়েছে!" },
  "contact.sentDesc": { en: "We'll get back to you soon.", bn: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।" },
};

// AI suggestions in both languages
export const suggestionsBn: string[] = [
  "১০ ইঞ্চি বাইরের দেয়াল ও ৫ ইঞ্চি ভেতরের দেয়াল ব্যবহার করলে ~৮% খরচ কমতে পারে।",
  "ফ্লাই অ্যাশ ইট ব্যবহারে শক্তি বজায় রেখে মালামাল খরচ কমানো যায়।",
  "করিডোরের এরিয়া কমালে মোট দেয়াল নির্মাণ খরচ কমবে।",
  "প্রিমিয়াম টাইলস ফিনিশিং খরচ অনেক বাড়ায় — কম দৃশ্যমান জায়গায় স্ট্যান্ডার্ড টাইলস বিবেচনা করুন।",
  "রান্নাঘর এবং বাথরুমে সঠিক বায়ুচলাচল নিশ্চিত করলে ভবিষ্যতে রক্ষণাবেক্ষণ খরচ কমবে।",
  "নির্মাণের সময় প্রি-এম্বেডেড ইলেকট্রিক্যাল কন্ডুইট ওয়্যারিং খরচে ১৫-২০% সাশ্রয় করে।",
  "ফাউন্ডেশন কাজের সময় ন্যূনতম অতিরিক্ত খরচে রেইনওয়াটার হার্ভেস্টিং সিস্টেম যোগ করা যায়।",
];

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("lang");
    return (saved === "bn" ? "bn" : "en") as Lang;
  });

  const handleSetLang = useCallback((l: Lang) => {
    setLang(l);
    localStorage.setItem("lang", l);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  const fmt = useCallback((n: number): string => {
    return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-IN").format(n);
  }, [lang]);

  const currency = useCallback((n: number): string => {
    return `৳${fmt(n)}`;
  }, [fmt]);

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t, currency, fmt }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
