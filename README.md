# CivilOS AI

Full Final Prompt

Prompt Title:
AI-Powered House Design Estimation & Construction Details Platform

Main Prompt:

Create a modern, professional, fully responsive web application called “Smart House Estimate AI” where users can upload a house design / floor plan / blueprint / building drawing / image / PDF and instantly get a complete construction estimate and detailed report.

The platform must look premium, clean, engineering-grade, trustworthy, and modern, suitable for civil engineers, contractors, architects, students, and house owners.

Core Objective

The system should allow users to:

 Upload house design files in formats like:

 JPG

 PNG

 PDF

 AutoCAD-export image/PDF

 Scanned floor plan

 After upload, the system should analyze the plan and generate: 
 
 Total built-up area

 Room-wise area

 Number of rooms

 Wall length estimation

 Column count suggestion

 Beam estimation

 Slab area

 Foundation estimate

 Brick quantity estimate

 Cement quantity estimate

 Sand quantity estimate

 Stone quantity estimate

 Rod/steel quantity estimate

 Labor cost

 Finishing cost

 Electrical estimation

 Plumbing estimation

 Paint estimation

 Tile/flooring estimation

 Doors and windows estimation

 Total project cost summary

 Show all calculations in a beautiful dashboard.

 Generate a downloadable estimate report in PDF.

Important System Behavior

The AI must not claim 100% engineering accuracy unless exact scale and measurements are provided.
If the uploaded design does not include proper dimensions, the app must:

 Ask the user to enter:

 Plot size

 Length and width

 Unit system (feet/meters)

 Number of floors

 Floor height

 Wall thickness

 Foundation type

 Roof/slab type

 Soil type

 Material quality level (standard/premium/economy)

Then the system should produce an approximate estimate.

If dimensions are visible in the drawing, use those values automatically.

Main Modules

1. Home Page

Include:

 Hero section with strong headline

 Upload design button

 Drag & drop upload area

 Demo preview section

 Features section

 “How it works” section

 Estimate categories section

 Testimonials section

 FAQ section

 Footer

Hero Text Example:

 Title: Upload Your House Design and Get Full Construction Estimate Instantly

 Subtitle: Smart AI-powered building estimation system for house owners, civil engineers, architects, and contractors.

 CTA buttons:

 Upload Design

 Try Demo

2. Upload & Analysis Module

Allow users to upload:

 Floor plan image

 Blueprint scan

 PDF drawing

 House layout image

After upload, show:

 File preview

 Input fields for missing dimensions

 Select project type:

 Single-storied house

 Duplex house

 Multi-storied building

 Commercial building

 Small shop/home combo

 Select location factor

 Select construction quality:

 Economy

 Standard

 Premium

Then click:
Analyze Design

3. Design Data Extraction Module

The AI should detect or ask for:

 External dimensions

 Internal room dimensions

 Number of bedrooms

 Number of bathrooms

 Kitchen

 Dining

 Drawing/living room

 Veranda/balcony

 Stair area

 Garage

 Store room

 Boundary wall

 Roof access

 Floor count

The app should show:

 Design summary card

 Recognized dimensions

 Missing values warning

 Confidence score of extraction

4. Estimate Dashboard

Create a beautiful dashboard with cards, charts, tables, and summaries.

Show these sections:

A. Project Summary

 Project name

 Plot size

 Total floor area

 Number of floors

 Estimated total construction cost

 Cost per square foot / square meter

 Approximate completion time

B. Civil Work Estimate

 Earthwork

 Excavation

 Foundation

 Footing

 Column

 Beam

 Slab

 Roof casting

 Masonry work

 Plaster work

C. Material Estimate

 Cement bags

 Sand (cft / m³)

 Stone chips

 Bricks / blocks

 Steel rods

 Water requirement

 Paint

 Tiles

 Electrical items

 Plumbing items

 Doors

 Windows

 Glass

 Grill/railing

D. Labor Estimate

 Mason

 Rod binder

 Carpenter

 Electrician

 Plumber

 Painter

 Tiles worker

 General labor

E. Finishing Estimate

 Floor finish

 Wall finish

 Ceiling finish

 Kitchen finish

 Bathroom finish

 Exterior paint

 Interior paint

 Wood polish

 False ceiling (optional)

F. Utility Estimate

 Electrical wiring points

 Switches

 DB box

 Plumbing pipe length

 Water tank size suggestion

 Sanitary fittings count

G. Room-wise Details
For each room, show:

 Room name

 Length

 Width

 Area

 Floor finish

 Wall area

 Paint estimate

 Number of doors/windows

5. Detailed Cost Breakdown

Create a section with:

 Item name

 Unit

 Quantity

 Rate

 Total amount

Also show:

 Subtotal

 Transport cost

 Labor cost

 Contractor overhead

 Contingency cost

 Engineering/design charge

 Total estimated budget

Include sliders or input boxes for:

 Material price adjustment

 Labor rate adjustment

 Location factor

 Inflation factor

 Waste percentage

6. Smart AI Suggestions

The AI should provide:

 Cost-saving suggestions

 Material optimization tips

 Structural caution notes

 Better room layout suggestions

 Ventilation suggestions

 Lighting suggestions

 Water line planning suggestion

 Future extension possibility

 Roof usage suggestion

 Stair design suggestion

Example:

 “Your current layout may increase wall construction cost.”

 “Reducing corridor area can lower total cost.”

 “Premium tiles significantly increase finishing cost.”

 “A 10-inch external wall and 5-inch internal wall combination may optimize cost.”

7. Report Generation

Generate downloadable:

 PDF Estimate Report

 Print-friendly view

PDF should include:

 Project summary

 Uploaded design preview

 Area breakdown

 Quantity breakdown

 Cost estimate

 Room-wise details

 Material table

 Notes and disclaimer

 Generated date

User Panel Features

Create a user system with:

 Sign up / Login

 Dashboard

 My Projects

 Saved Estimates

 Download Reports

 Edit Inputs

 Recalculate Estimate

 Compare Projects

 Profile Settings

User can:

 Upload multiple designs

 Save estimate history

 Duplicate a project

 Update material rates

 Track versions

Admin Panel Features

Create hidden admin access from footer text:
© Smart House Estimate AI
When clicked multiple times or long-pressed, admin login opens.

Admin panel features:

 Dashboard overview

 Total users

 Total projects

 Total reports generated

 Material price management

 Labor rate management

 Location factor management

 Estimate formula settings

 Category management

 User management

 Project management

 Delete/edit estimates

 PDF report settings

 Announcement management

 Contact message management

Calculation Logic

The system should support approximate calculation logic like:

Area

 Total built-up area = sum of all room areas

 Floor area = length × width

Brickwork

 Wall length × wall height × wall thickness = wall volume

 Estimate bricks based on standard brick size

Cement, Sand, Stone

Use common civil engineering approximation formulas for:

 PCC

 RCC

 Mortar

 Plaster

Steel

Estimate based on:

 Column size

 Beam size

 Slab area

 Building type

Paint

 Wall area minus door/window area

 Interior and exterior separately

Tiles

 Floor area + wastage percentage

Electrical

Estimate based on:

 Room count

 Point count

 Fan/light/socket allocation

Plumbing

Estimate based on:

 Bathroom count

 Kitchen count

 Water line and drainage line assumption

Add a note:
“Final structural design and BOQ should be verified by a licensed civil engineer.”

UI/UX Requirements

Design must be:

 Premium

 Modern

 Colorful but professional

 Mobile responsive

 Fast loading

 User friendly

 Card-based dashboard

 Clean typography

 Smooth animations

 Professional icons

 Engineering-style data layout

Suggested Color Style

 Primary: Deep Blue

 Secondary: White

 Accent: Orange or Green

 Soft gray backgrounds

 Professional gradient hero section

Extra Smart Features

Add these advanced features:

 Compare two house designs

 Estimate based on budget limit

 Suggest cheaper alternatives

 Cost per room

 Multi-floor estimate

 Unit converter (sq ft / sq m)

 Bangla + English language toggle

 Dark/light mode

 Search estimate history

 Share report link

 Print estimate

 Save as draft

Technology Stack

Use:

 React / Next.js frontend

 Firebase Authentication

 Firestore database

 Firebase Storage for uploads

 PDF generation

 OCR or image parsing support

 AI analysis layer for design understanding

 Responsive dashboard

 Chart visualization

Firebase Collections Structure

Use these collections:

users

 uid

 name

 email

 phone

 role

 createdAt

projects

 projectId

 userId

 projectName

 fileUrl

 fileType

 plotSize

 floorCount

 qualityType

 locationFactor

 estimateStatus

 createdAt

design_analysis

 analysisId

 projectId

 extractedRooms

 totalArea

 wallLength

 slabArea

 detectedDimensions

 missingInputs

 aiNotes

estimates

 estimateId

 projectId

 materialEstimate

 laborEstimate

 finishingEstimate

 electricalEstimate

 plumbingEstimate

 totalCost

 costPerSqft

 generatedAt

material_rates

 materialId

 materialName

 unit

 rate

 lastUpdated

labor_rates

 laborId

 laborName

 unit

 rate

 lastUpdated

reports

 reportId

 projectId

 pdfUrl

 generatedAt

contact_messages

 id

 name

 email

 subject

 message

 createdAt

Pages Structure

Create these pages:

 Home

 Upload Design

 Estimate Result

 My Projects

 Project Details

 Compare Estimates

 Pricing

 About

 Contact

 FAQ

 Login

 Register

 User Dashboard

 Admin Dashboard

 Report View

SEO Requirements

Add full SEO optimization.

Meta Title

Smart House Estimate AI | Upload Design and Get Full Construction Estimate

Meta Description

Upload your house design, floor plan, or blueprint and get instant construction estimate, material calculation, room-wise details, labor cost, and full project budget with AI.

Keywords

 house estimate AI

 construction estimate app

 building material calculator

 floor plan estimate

 civil engineering estimate

 house design cost calculator

 room wise construction estimate

 AI house planning

 building cost estimator

 house budget planner

Footer Content

 About

 Terms

 Privacy Policy

 Contact

 FAQ

 Admin Access

 Copyright

Footer text:
© 2026 Smart House Estimate AI. All rights reserved.

Final Instruction to AI Builder

Build this project as a fully functional, polished, production-style application.
It must not look like a simple demo.
It should look like a real SaaS-grade estimation platform for civil engineering and house construction planning.

Focus on:

 Accurate-looking engineering dashboard

 Smooth upload flow

 User-friendly inputs

 Beautiful estimate visualization

 Clean tables and charts

 Downloadable report

 Strong admin control

 Professional UI in both Bangla and English

Also add demo sample project data so the platform looks complete even before first upload.   Devoloped by Md Zobaer Hasan

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://civilosai.pro.bd

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fba1f912-34ab-4b2e-810e-d677202bf086).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
