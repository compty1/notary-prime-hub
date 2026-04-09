export const TEMPLATE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "legal", label: "Legal" },
  { value: "notary", label: "Notary" },
  { value: "business", label: "Business" },
  { value: "personal", label: "Personal" },
] as const;

// #72: Template difficulty/complexity ratings
export type TemplateDifficulty = "beginner" | "intermediate" | "advanced";

export const TEMPLATES = [
  { id: "blank", label: "Blank Document", icon: "📄", category: "personal", difficulty: "beginner" as TemplateDifficulty, content: "<p><br></p>" },
  { id: "contract", label: "Service Contract", icon: "📋", category: "legal", difficulty: "intermediate" as TemplateDifficulty, content: "<h1>Service Agreement</h1><p>This agreement is entered into between the following parties...</p><h2>1. Scope of Services</h2><p></p><h2>2. Compensation</h2><p></p><h2>3. Terms & Conditions</h2><p></p><h2>4. Signatures</h2><p></p>" },
  { id: "affidavit", label: "Affidavit", icon: "⚖️", category: "legal", difficulty: "intermediate" as TemplateDifficulty, content: "<h1>Affidavit</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>I, ____________, being duly sworn, do hereby state under oath:</p><ol><li></li></ol><p>Signed this ___ day of ____________, 20___.</p><p>___________________________<br>Affiant Signature</p>" },
  { id: "deed", label: "Warranty Deed", icon: "🏠", category: "legal", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Warranty Deed</h1><p>This deed is made on ____________, by and between:</p><p><strong>Grantor:</strong> ____________</p><p><strong>Grantee:</strong> ____________</p><h2>Property Description</h2><p></p><h2>Covenants</h2><p></p>" },
  { id: "poa", label: "Power of Attorney", icon: "✍️", category: "legal", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Power of Attorney</h1><p>I, ____________ (\"Principal\"), of ____________, Ohio, hereby appoint ____________ (\"Agent\") as my attorney-in-fact to act on my behalf...</p><h2>Powers Granted</h2><ul><li></li></ul><h2>Duration</h2><p></p>" },
  { id: "proposal", label: "Business Proposal", icon: "💼", category: "business", difficulty: "beginner" as TemplateDifficulty, content: "<h1>Proposal</h1><h2>Executive Summary</h2><p></p><h2>Problem Statement</h2><p></p><h2>Proposed Solution</h2><p></p><h2>Timeline & Deliverables</h2><p></p><h2>Investment</h2><p></p>" },
  { id: "letter", label: "Formal Letter", icon: "✉️", category: "business", difficulty: "beginner" as TemplateDifficulty, content: "<p>[Your Name]<br>[Address]<br>[Date]</p><p>[Recipient Name]<br>[Recipient Address]</p><p>Dear ____________,</p><p></p><p>Sincerely,</p><p>___________________________</p>" },
  { id: "report", label: "Report", icon: "📊", category: "business", difficulty: "beginner" as TemplateDifficulty, content: "<h1>Report Title</h1><p><strong>Prepared by:</strong> ____________<br><strong>Date:</strong> ____________</p><h2>1. Introduction</h2><p></p><h2>2. Findings</h2><p></p><h2>3. Recommendations</h2><p></p><h2>4. Conclusion</h2><p></p>" },
  { id: "notary-jurat", label: "Jurat Certificate", icon: "📜", category: "notary", difficulty: "intermediate" as TemplateDifficulty, content: "<h1>Jurat Certificate</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>Subscribed and sworn to (or affirmed) before me on this ___ day of ____________, 20___, by ____________, proved to me on the basis of satisfactory evidence to be the person(s) who appeared before me.</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio<br>My Commission Expires: ____________</p>" },
  { id: "notary-ack", label: "Acknowledgment", icon: "✅", category: "notary", difficulty: "intermediate" as TemplateDifficulty, content: "<h1>Certificate of Acknowledgment</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>On ____________, before me, ____________, a Notary Public in and for said state, personally appeared ____________, who proved to me on the basis of satisfactory evidence to be the person(s) whose name(s) is/are subscribed to the within instrument and acknowledged to me that he/she/they executed the same in his/her/their authorized capacity(ies).</p><p>WITNESS my hand and official seal.</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio</p>" },
  { id: "ron-cert", label: "RON Certificate", icon: "🖥️", category: "notary", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Remote Online Notarization Certificate</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>On ____________, I, ____________, a Notary Public commissioned in the State of Ohio, performed a remote online notarization in accordance with Ohio Revised Code §147.60–147.66.</p><h2>Signer Information</h2><p><strong>Name:</strong> ____________<br><strong>Location at Time of Notarization:</strong> ____________</p><h2>Identity Verification</h2><p>Identity was verified through knowledge-based authentication (KBA) and credential analysis as required by ORC §147.63.</p><h2>Recording</h2><p>An audio-video recording of this session has been made and will be retained for a minimum of 10 years per ORC §147.66.</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio<br>Commission Number: ____________<br>Commission Expiration: ____________</p>" },
  { id: "copy-cert", label: "Copy Certification", icon: "📑", category: "notary", difficulty: "intermediate" as TemplateDifficulty, content: "<h1>Copy Certification</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>I certify that this is a true, exact, complete, and unaltered photocopy of the original document presented to me by the document's custodian, ____________.</p><p>Date: ____________</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio<br>My Commission Expires: ____________</p>" },
  { id: "nda", label: "Non-Disclosure Agreement", icon: "🔒", category: "legal", difficulty: "intermediate" as TemplateDifficulty, content: "<h1>Non-Disclosure Agreement</h1><p>This Non-Disclosure Agreement (\"Agreement\") is entered into as of ____________ by and between:</p><p><strong>Disclosing Party:</strong> ____________</p><p><strong>Receiving Party:</strong> ____________</p><h2>1. Confidential Information</h2><p></p><h2>2. Obligations</h2><p></p><h2>3. Term</h2><p></p><h2>4. Signatures</h2><p></p>" },
  { id: "invoice", label: "Invoice", icon: "💰", category: "business", difficulty: "beginner" as TemplateDifficulty, content: "<h1>Invoice</h1><p><strong>Invoice #:</strong> ____________<br><strong>Date:</strong> ____________</p><p><strong>From:</strong><br>____________<br>____________</p><p><strong>Bill To:</strong><br>____________<br>____________</p><table><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr><tr><td></td><td></td><td></td><td></td></tr></table><p><strong>Total:</strong> $____________</p>" },
  { id: "meeting-minutes", label: "Meeting Minutes", icon: "📝", category: "business", difficulty: "beginner" as TemplateDifficulty, content: "<h1>Meeting Minutes</h1><p><strong>Date:</strong> ____________<br><strong>Time:</strong> ____________<br><strong>Location:</strong> ____________</p><h2>Attendees</h2><ul><li></li></ul><h2>Agenda</h2><ol><li></li></ol><h2>Discussion</h2><p></p><h2>Action Items</h2><ul><li></li></ul><h2>Next Meeting</h2><p></p>" },
  { id: "resume", label: "Resume / CV", icon: "👤", category: "personal", difficulty: "beginner" as TemplateDifficulty, content: "<h1>[Your Name]</h1><p>[Email] | [Phone] | [Location]</p><h2>Professional Summary</h2><p></p><h2>Experience</h2><h3>[Job Title] — [Company]</h3><p><em>[Dates]</em></p><ul><li></li></ul><h2>Education</h2><p></p><h2>Skills</h2><ul><li></li></ul>" },
  { id: "corporate-resolution", label: "Corporate Resolution", icon: "🏢", category: "business", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Corporate Resolution</h1><p><strong>Resolution of the Board of Directors</strong><br>of ____________ (\"Corporation\")</p><p>At a duly convened meeting of the Board of Directors held on ____________, 20___, the following resolutions were unanimously adopted:</p><h2>RESOLVED</h2><p>That ____________ is hereby authorized to ____________ on behalf of the Corporation.</p><h2>FURTHER RESOLVED</h2><p>That the officers of the Corporation are hereby authorized and directed to take any and all actions necessary to effectuate the purpose of this resolution.</p><p>The undersigned Secretary of the Corporation hereby certifies that the foregoing is a true and correct copy of a resolution adopted at the meeting described above.</p><p><br></p><p>___________________________<br>Secretary<br>Date: ____________</p>" },
  { id: "living-trust", label: "Living Trust", icon: "🏛️", category: "legal", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Declaration of Revocable Living Trust</h1><p><strong>Trust Name:</strong> The ____________ Living Trust<br><strong>Date Established:</strong> ____________</p><h2>Article I — Trust Establishment</h2><p>I, ____________ (\"Settlor\" / \"Trustee\"), of ____________ County, Ohio, hereby declare that I hold the following described property in trust.</p><h2>Article II — Trust Property</h2><p></p><h2>Article III — Beneficiaries</h2><p></p><h2>Article IV — Trustee Powers</h2><p>The Trustee shall have all powers conferred by Ohio Revised Code Chapter 5808.</p><h2>Article V — Successor Trustee</h2><p>Upon the death or incapacity of the initial Trustee, ____________ shall serve as Successor Trustee.</p><h2>Article VI — Revocation</h2><p>This trust may be revoked or amended at any time during the Settlor's lifetime.</p><p><br></p><p>___________________________<br>Settlor / Trustee Signature<br>Date: ____________</p>" },
  { id: "last-will", label: "Last Will & Testament", icon: "📜", category: "legal", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Last Will and Testament</h1><p>of ____________</p><p>I, ____________, a resident of ____________ County, State of Ohio, being of sound mind and memory, do hereby declare this instrument to be my Last Will and Testament, revoking all prior wills and codicils.</p><h2>Article I — Debts & Expenses</h2><p>I direct my Executor to pay all legally enforceable debts and funeral expenses.</p><h2>Article II — Specific Bequests</h2><p></p><h2>Article III — Residuary Estate</h2><p>I give, devise, and bequeath the rest, residue, and remainder of my estate to ____________.</p><h2>Article IV — Executor</h2><p>I appoint ____________ as Executor of this Will.</p><h2>Article V — Guardian</h2><p>If applicable, I appoint ____________ as guardian of any minor children.</p><p><br></p><p>IN WITNESS WHEREOF, I have signed this Will on ____________, 20___.</p><p>___________________________<br>Testator Signature</p><p><strong>Witnesses:</strong></p><p>Witness 1: ___________________________ Date: _______________</p><p>Witness 2: ___________________________ Date: _______________</p>" },
  { id: "lease-agreement", label: "Residential Lease", icon: "🏠", category: "legal", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Residential Lease Agreement</h1><p><strong>State of Ohio</strong></p><p>This Lease Agreement is entered into on ____________ between:</p><p><strong>Landlord:</strong> ____________<br><strong>Tenant:</strong> ____________</p><h2>1. Premises</h2><p>The Landlord agrees to lease the property located at ____________ to the Tenant.</p><h2>2. Term</h2><p>The lease term begins on ____________ and ends on ____________.</p><h2>3. Rent</h2><p>Monthly rent is $____________, due on the ___ day of each month.</p><h2>4. Security Deposit</h2><p>A security deposit of $____________ is required per Ohio R.C. §5321.16.</p><h2>5. Utilities</h2><p></p><h2>6. Maintenance & Repairs</h2><p>Per Ohio R.C. §5321.04, the Landlord shall maintain the premises in a fit and habitable condition.</p><h2>7. Termination</h2><p></p><h2>8. Signatures</h2><p>Landlord: ___________________________ Date: _______________</p><p>Tenant: ___________________________ Date: _______________</p>" },
  { id: "employment-agreement", label: "Employment Agreement", icon: "💼", category: "business", difficulty: "intermediate" as TemplateDifficulty, content: "<h1>Employment Agreement</h1><p>This Employment Agreement is entered into as of ____________ by and between:</p><p><strong>Employer:</strong> ____________<br><strong>Employee:</strong> ____________</p><h2>1. Position & Duties</h2><p>Employee shall serve as ____________ and perform duties as reasonably assigned.</p><h2>2. Compensation</h2><p>Base salary of $____________ per year, payable in accordance with Employer's regular payroll schedule.</p><h2>3. Benefits</h2><p></p><h2>4. Term & Termination</h2><p>This agreement is at-will and may be terminated by either party with ____________ days written notice.</p><h2>5. Confidentiality</h2><p>Employee agrees to maintain the confidentiality of all proprietary information.</p><h2>6. Non-Compete</h2><p></p><h2>7. Governing Law</h2><p>This agreement shall be governed by the laws of the State of Ohio.</p><h2>8. Signatures</h2><p>Employer: ___________________________ Date: _______________</p><p>Employee: ___________________________ Date: _______________</p>" },
  { id: "operating-agreement", label: "LLC Operating Agreement", icon: "📑", category: "business", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Operating Agreement</h1><p>of ____________ LLC</p><p>This Operating Agreement is entered into effective ____________ by the undersigned Member(s).</p><h2>Article I — Formation</h2><p>The Company was formed under the Ohio Revised Code Chapter 1706.</p><h2>Article II — Purpose</h2><p>The purpose of the Company is to ____________.</p><h2>Article III — Members</h2><table><tr><th>Member Name</th><th>Ownership %</th><th>Capital Contribution</th></tr><tr><td></td><td></td><td></td></tr></table><h2>Article IV — Management</h2><p>The Company shall be [member-managed / manager-managed].</p><h2>Article V — Distributions</h2><p></p><h2>Article VI — Dissolution</h2><p></p><p>___________________________<br>Member Signature(s)<br>Date: ____________</p>" },
  { id: "promissory-note", label: "Promissory Note", icon: "💵", category: "legal", difficulty: "intermediate" as TemplateDifficulty, content: "<h1>Promissory Note</h1><p><strong>Date:</strong> ____________<br><strong>Principal Amount:</strong> $____________</p><p>FOR VALUE RECEIVED, the undersigned (\"Borrower\"), ____________, promises to pay to the order of ____________ (\"Lender\") the principal sum of $____________, with interest at the rate of ___% per annum.</p><h2>Payment Terms</h2><p>Payments of $____________ shall be due on the ___ day of each month, commencing ____________.</p><h2>Default</h2><p>In the event of default, the entire unpaid balance shall become immediately due and payable.</p><h2>Governing Law</h2><p>This Note shall be governed by the laws of the State of Ohio.</p><p><br></p><p>___________________________<br>Borrower Signature<br>Date: ____________</p><p>___________________________<br>Lender Signature<br>Date: ____________</p>" },
  { id: "demand-letter", label: "Demand Letter", icon: "⚠️", category: "legal", difficulty: "intermediate" as TemplateDifficulty, content: "<h1>Demand Letter</h1><p>[Your Name]<br>[Your Address]<br>[Date]</p><p>[Recipient Name]<br>[Recipient Address]</p><p>RE: Demand for ____________</p><p>Dear ____________,</p><p>This letter serves as a formal demand regarding ____________. Please be advised of the following facts:</p><ol><li></li></ol><p>I hereby demand that you ____________ within ____________ days of the date of this letter.</p><p>If you fail to comply with this demand, I reserve the right to pursue all available legal remedies, including but not limited to filing a lawsuit in the appropriate Ohio court.</p><p>Please govern yourself accordingly.</p><p>Sincerely,</p><p>___________________________<br>[Your Name]</p>" },
  { id: "real-estate-closing", label: "Real Estate Closing Checklist", icon: "🏡", category: "business", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Real Estate Closing Document Checklist</h1><p><strong>Property Address:</strong> ____________<br><strong>Closing Date:</strong> ____________<br><strong>Buyer:</strong> ____________<br><strong>Seller:</strong> ____________</p><h2>Pre-Closing Documents</h2><ul><li>☐ Purchase Agreement (fully executed)</li><li>☐ Title Search Report</li><li>☐ Title Insurance Commitment</li><li>☐ Property Survey</li><li>☐ Home Inspection Report</li><li>☐ Appraisal Report</li><li>☐ Loan Approval / Pre-Approval Letter</li></ul><h2>Closing Documents</h2><ul><li>☐ Warranty Deed (ORC §5302)</li><li>☐ Closing Disclosure (TRID)</li><li>☐ Promissory Note</li><li>☐ Deed of Trust / Mortgage</li><li>☐ Affidavit of Title</li><li>☐ Transfer Tax Declaration</li><li>☐ Settlement Statement</li></ul><h2>Post-Closing</h2><ul><li>☐ Record Deed with County Recorder</li><li>☐ Issue Title Insurance Policy</li><li>☐ Distribute Funds</li></ul>" },
  { id: "healthcare-poa", label: "Healthcare Power of Attorney", icon: "🏥", category: "legal", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Healthcare Power of Attorney</h1><p><strong>State of Ohio</strong></p><p>I, ____________ (\"Principal\"), of ____________ County, Ohio, hereby designate ____________ (\"Agent\") as my healthcare attorney-in-fact pursuant to Ohio R.C. §1337.12.</p><h2>Powers Granted</h2><p>My Agent shall have authority to make any and all healthcare decisions on my behalf if I become unable to do so, including but not limited to:</p><ul><li>Consent to or refuse medical treatment</li><li>Select healthcare providers and facilities</li><li>Access medical records</li><li>Make end-of-life decisions as specified herein</li></ul><h2>Limitations</h2><p></p><h2>Alternate Agent</h2><p>If my primary Agent is unable or unwilling to serve, I designate ____________ as alternate Agent.</p><h2>Effective Date</h2><p>This power of attorney shall become effective upon a determination by my attending physician that I am unable to make informed healthcare decisions.</p><p><br></p><p>___________________________<br>Principal Signature<br>Date: ____________</p><p>___________________________<br>Witness 1<br>Date: ____________</p><p>___________________________<br>Witness 2<br>Date: ____________</p>" },
  { id: "living-will", label: "Living Will Declaration", icon: "📋", category: "legal", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Living Will Declaration</h1><p><strong>State of Ohio</strong> — Pursuant to Ohio R.C. §2133.02</p><p>I, ____________, being of sound mind, voluntarily make this declaration to be carried out if I am unable to participate in decisions regarding my medical care.</p><h2>Declaration</h2><p>If I am in a terminal condition or permanently unconscious state, I direct my attending physician to withhold or withdraw life-sustaining treatment that serves only to prolong the process of dying.</p><h2>Specific Instructions</h2><p></p><h2>Pain Management</h2><p>I direct that treatment for comfort care and alleviation of pain shall be provided at all times.</p><p><br></p><p>Signed: ___________________________ Date: ____________</p><p>Witness 1: ___________________________ Date: ____________</p><p>Witness 2: ___________________________ Date: ____________</p><p><em>Note: Per ORC §2133.02, this declaration must be witnessed by two adults who are not related to the declarant and who will not benefit from the declarant's estate.</em></p>" },
  { id: "loan-package", label: "Loan Signing Package", icon: "🏦", category: "notary", difficulty: "advanced" as TemplateDifficulty, content: "<h1>Loan Signing Package Checklist</h1><p><strong>Borrower(s):</strong> ____________<br><strong>Lender:</strong> ____________<br><strong>Loan Number:</strong> ____________<br><strong>Signing Date:</strong> ____________</p><h2>Required Documents</h2><ul><li>☐ Promissory Note</li><li>☐ Deed of Trust / Mortgage</li><li>☐ Closing Disclosure</li><li>☐ Right to Cancel (if applicable)</li><li>☐ Compliance Agreement</li><li>☐ Borrower Certification & Authorization</li><li>☐ Name Affidavit</li><li>☐ Occupancy Affidavit</li><li>☐ Signature/Name Affidavit</li><li>☐ Tax Authorization (4506-T/C)</li><li>☐ HUD-1/ALTA Settlement Statement</li></ul><h2>Notary Checklist</h2><ul><li>☐ Verify signer ID (ORC §147.53 — acceptable credentials)</li><li>☐ Confirm correct name spelling on all documents</li><li>☐ Administer oath for sworn documents</li><li>☐ Complete journal entries</li><li>☐ Affix notary seal to all notarized pages</li><li>☐ Scan completed package for return</li></ul><h2>Notes</h2><p></p>" },
  { id: "vehicle-title-poa", label: "Vehicle Title POA", icon: "🚗", category: "legal", difficulty: "beginner" as TemplateDifficulty, content: "<h1>Power of Attorney for Motor Vehicle Title</h1><p><strong>State of Ohio</strong></p><p>I, ____________ (\"Principal\"), hereby appoint ____________ (\"Agent\") as my attorney-in-fact for the purpose of executing title transfer documents for the following vehicle:</p><p><strong>Year:</strong> ____________ <strong>Make:</strong> ____________ <strong>Model:</strong> ____________<br><strong>VIN:</strong> ____________</p><p>This authority includes the power to sign, execute, and deliver any and all documents necessary to complete the title transfer at the Ohio BMV, including Ohio BMV Form 1131.</p><p>This power of attorney shall remain in effect until the completion of the title transfer or until revoked in writing.</p><p><br></p><p>___________________________<br>Principal Signature<br>Date: ____________</p><p><br></p><p>NOTARY ACKNOWLEDGMENT<br>State of Ohio, County of ____________</p><p>Before me on this ___ day of ____________, 20___, personally appeared ____________, proven to me on satisfactory evidence to be the person whose name is subscribed above.</p><p>___________________________<br>Notary Public — State of Ohio<br>My Commission Expires: ____________</p>" },
  { id: "contractor-agreement", label: "Independent Contractor Agreement", icon: "🔧", category: "business", difficulty: "beginner" as TemplateDifficulty, content: "<h1>Independent Contractor Agreement</h1><p>This Agreement is entered into as of ____________ by and between:</p><p><strong>Client:</strong> ____________<br><strong>Contractor:</strong> ____________</p><h2>1. Services</h2><p>Contractor agrees to perform the following services: ____________</p><h2>2. Compensation</h2><p>Client shall pay Contractor $____________ for the services described above.</p><h2>3. Independent Contractor Status</h2><p>Contractor is an independent contractor and not an employee. Contractor shall be responsible for all taxes, including self-employment taxes.</p><h2>4. Term</h2><p>This agreement begins on ____________ and continues until ____________ or until terminated by either party with ____________ days written notice.</p><h2>5. Ownership of Work Product</h2><p></p><h2>6. Confidentiality</h2><p></p><h2>7. Governing Law</h2><p>This agreement shall be governed by the laws of the State of Ohio.</p><h2>8. Signatures</h2><p>Client: ___________________________ Date: _______________</p><p>Contractor: ___________________________ Date: _______________</p>" },
];

export const BRAND_FONTS = [
  { value: "sans", label: "Sans-Serif", family: "ui-sans-serif, system-ui, sans-serif" },
  { value: "serif", label: "Serif", family: "ui-serif, Georgia, serif" },
  { value: "mono", label: "Monospace", family: "ui-monospace, monospace" },
  { value: "arial", label: "Arial", family: "Arial, Helvetica, sans-serif" },
  { value: "times", label: "Times New Roman", family: "'Times New Roman', Times, serif" },
  { value: "georgia", label: "Georgia", family: "Georgia, serif" },
  { value: "courier", label: "Courier New", family: "'Courier New', Courier, monospace" },
  { value: "garamond", label: "Garamond", family: "Garamond, serif" },
];

export const ACCENT_COLORS = [
  { value: "#F59E0B", label: "Amber" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Emerald" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#EF4444", label: "Red" },
  { value: "#1E293B", label: "Slate" },
  { value: "#EC4899", label: "Pink" },
  { value: "#14B8A6", label: "Teal" },
];

export const TEXT_COLORS = [
  { value: "#000000", label: "Black" },
  { value: "#1E293B", label: "Slate" },
  { value: "#374151", label: "Gray" },
  { value: "#DC2626", label: "Red" },
  { value: "#EA580C", label: "Orange" },
  { value: "#D97706", label: "Amber" },
  { value: "#16A34A", label: "Green" },
  { value: "#2563EB", label: "Blue" },
  { value: "#7C3AED", label: "Purple" },
  { value: "#DB2777", label: "Pink" },
];

export const HIGHLIGHT_COLORS = [
  { value: "#FEF08A", label: "Yellow" },
  { value: "#BBF7D0", label: "Green" },
  { value: "#BFDBFE", label: "Blue" },
  { value: "#FBCFE8", label: "Pink" },
  { value: "#FED7AA", label: "Orange" },
  { value: "#E9D5FF", label: "Purple" },
];

export const FONT_SIZES = [
  "8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72",
];

export const LANGUAGES = [
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic (RTL)" },
  { value: "he", label: "Hebrew (RTL)" },
];

export const SIDEBAR_TABS = [
  { id: "templates", label: "Templates" },
  { id: "ai", label: "AI Tools" },
  { id: "elements", label: "Elements" },
  { id: "design", label: "Design" },
  { id: "translate", label: "Translate" },
  { id: "history", label: "History" },
] as const;

export const PAGE_SIZES = [
  { value: "letter", label: "US Letter", width: 816, height: 1056 },
  { value: "legal", label: "US Legal", width: 816, height: 1344 },
  { value: "a4", label: "A4", width: 794, height: 1123 },
  { value: "a5", label: "A5", width: 559, height: 794 },
  { value: "letter-landscape", label: "Letter Landscape", width: 1056, height: 816 },
] as const;

export const LINE_SPACINGS = [
  { value: "1", label: "Single" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "Double" },
  { value: "2.5", label: "2.5" },
] as const;

export type MarginPreset = { value: string; label: string; top: number; right: number; bottom: number; left: number };

export const MARGIN_PRESETS: MarginPreset[] = [
  { value: "normal", label: "Normal", top: 48, right: 48, bottom: 48, left: 48 },
  { value: "narrow", label: "Narrow", top: 24, right: 24, bottom: 24, left: 24 },
  { value: "wide", label: "Wide", top: 48, right: 72, bottom: 48, left: 72 },
  { value: "none", label: "None", top: 12, right: 12, bottom: 12, left: 12 },
];

export const SPECIAL_CHARACTERS = [
  { char: "§", label: "Section" },
  { char: "¶", label: "Pilcrow" },
  { char: "©", label: "Copyright" },
  { char: "®", label: "Registered" },
  { char: "™", label: "Trademark" },
  { char: "°", label: "Degree" },
  { char: "±", label: "Plus-Minus" },
  { char: "×", label: "Multiply" },
  { char: "÷", label: "Divide" },
  { char: "≤", label: "LTE" },
  { char: "≥", label: "GTE" },
  { char: "≠", label: "Not Equal" },
  { char: "∞", label: "Infinity" },
  { char: "µ", label: "Micro" },
  { char: "†", label: "Dagger" },
  { char: "‡", label: "Double Dagger" },
  { char: "•", label: "Bullet" },
  { char: "…", label: "Ellipsis" },
  { char: "—", label: "Em Dash" },
  { char: "–", label: "En Dash" },
  { char: "€", label: "Euro" },
  { char: "£", label: "Pound" },
  { char: "¥", label: "Yen" },
  { char: "¢", label: "Cent" },
];

export const LEGAL_CLAUSES = [
  {
    id: "ohio-governing-law",
    label: "Ohio Governing Law",
    category: "legal",
    content: "<p>This agreement shall be governed by and construed in accordance with the laws of the State of Ohio, without regard to its conflict of law principles. Any legal action or proceeding arising under this agreement shall be brought exclusively in the courts of the State of Ohio.</p>",
  },
  {
    id: "ohio-notary-disclaimer",
    label: "Notary Disclaimer (ORC §147.01)",
    category: "notary",
    content: "<p><strong>DISCLAIMER:</strong> The notary public is not an attorney licensed to practice law in the State of Ohio and may not give legal advice or accept fees for legal advice. Pursuant to ORC §147.01, a notary public is authorized only to perform notarial acts as defined by Ohio law.</p>",
  },
  {
    id: "esign-consent",
    label: "E-Sign Consent Clause",
    category: "legal",
    content: "<p><strong>Electronic Signature Consent:</strong> By signing this document electronically, I consent to conduct this transaction by electronic means pursuant to the Electronic Signatures in Global and National Commerce Act (ESIGN Act, 15 U.S.C. §7001 et seq.) and the Uniform Electronic Transactions Act (UETA) as adopted by the State of Ohio (ORC §1306.01 et seq.).</p>",
  },
  {
    id: "ron-disclosure",
    label: "RON Session Disclosure",
    category: "notary",
    content: "<p><strong>Remote Online Notarization Disclosure:</strong> This notarial act was performed via remote online notarization (RON) in accordance with Ohio Revised Code §147.60–147.66. The signer's identity was verified through knowledge-based authentication (KBA) and credential analysis. An audio-video recording of this session will be retained for a minimum of ten (10) years per ORC §147.66.</p>",
  },
  {
    id: "witness-attestation",
    label: "Witness Attestation",
    category: "notary",
    content: "<p>We, the undersigned witnesses, hereby attest that the foregoing instrument was signed in our presence by the above-named individual(s), who appeared to be of sound mind and under no duress or undue influence.</p><p>Witness 1: ___________________________ Date: _______________</p><p>Witness 2: ___________________________ Date: _______________</p>",
  },
  {
    id: "severability",
    label: "Severability Clause",
    category: "legal",
    content: "<p><strong>Severability:</strong> If any provision of this agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.</p>",
  },
  {
    id: "entire-agreement",
    label: "Entire Agreement",
    category: "legal",
    content: "<p><strong>Entire Agreement:</strong> This document constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to this subject matter.</p>",
  },
  {
    id: "indemnification",
    label: "Indemnification",
    category: "legal",
    content: "<p><strong>Indemnification:</strong> Each party agrees to indemnify, defend, and hold harmless the other party from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to any breach of this agreement.</p>",
  },
  {
    id: "confidentiality",
    label: "Confidentiality",
    category: "legal",
    content: "<p><strong>Confidentiality:</strong> The parties agree to keep confidential all information exchanged in connection with this agreement. Neither party shall disclose such information to any third party without the prior written consent of the other party, except as required by law.</p>",
  },
  {
    id: "force-majeure",
    label: "Force Majeure",
    category: "legal",
    content: "<p><strong>Force Majeure:</strong> Neither party shall be liable for any failure or delay in performance under this agreement due to circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, pandemic, war, terrorism, government actions, or interruptions in telecommunications or power supply.</p>",
  },
];

export const PAGE_BACKGROUND_COLORS = [
  { value: "#FFFFFF", label: "White" },
  { value: "#FFFBEB", label: "Warm" },
  { value: "#F0FDF4", label: "Green Tint" },
  { value: "#EFF6FF", label: "Blue Tint" },
  { value: "#FDF2F8", label: "Pink Tint" },
  { value: "#F5F3FF", label: "Purple Tint" },
  { value: "#FAFAF9", label: "Stone" },
  { value: "#F8FAFC", label: "Slate" },
  { value: "#1E293B", label: "Dark Slate" },
  { value: "#111827", label: "Dark" },
];

export const COMPLIANCE_WATERMARKS = [
  { value: "none", label: "None" },
  { value: "draft", label: "DRAFT" },
  { value: "copy", label: "COPY" },
  { value: "original", label: "ORIGINAL" },
  { value: "confidential", label: "CONFIDENTIAL" },
] as const;

export const DEFAULT_HEADER = "";
export const DEFAULT_FOOTER = '<p style="text-align:center;font-size:10px;color:#999;">Page {{page}} of {{total}}</p>';
