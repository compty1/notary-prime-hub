/**
 * DS-002: Certificate PDF data builder
 * Generates structured data for notary certificates ready for PDF rendering
 */

export interface CertificateData {
  certificateType: "acknowledgment" | "jurat" | "copy_certification" | "oath" | "signature_witnessing";
  stateName: string;
  countyName: string;
  notaryName: string;
  commissionNumber: string;
  commissionExpiry: string;
  signerName: string;
  documentDescription: string;
  dateOfNotarization: string;
  additionalSigners?: string[];
  customText?: string;
}

const CERTIFICATE_TEMPLATES: Record<string, string> = {
  acknowledgment: `STATE OF {state}
COUNTY OF {county}

On this {date}, before me, {notaryName}, a Notary Public in and for said state, personally appeared {signerName}, known to me (or proved to me on the basis of satisfactory evidence) to be the person(s) whose name(s) is/are subscribed to the within instrument and acknowledged to me that he/she/they executed the same in his/her/their authorized capacity(ies), and that by his/her/their signature(s) on the instrument the person(s), or the entity upon behalf of which the person(s) acted, executed the instrument.

WITNESS my hand and official seal.

____________________________
{notaryName}
Notary Public, State of {state}
Commission No.: {commissionNumber}
My Commission Expires: {commissionExpiry}`,

  jurat: `STATE OF {state}
COUNTY OF {county}

Subscribed and sworn to (or affirmed) before me on this {date}, by {signerName}, proved to me on the basis of satisfactory evidence to be the person(s) who appeared before me.

WITNESS my hand and official seal.

____________________________
{notaryName}
Notary Public, State of {state}
Commission No.: {commissionNumber}
My Commission Expires: {commissionExpiry}`,

  copy_certification: `STATE OF {state}
COUNTY OF {county}

I, {notaryName}, a Notary Public in and for said state, do hereby certify that on {date}, I examined the original document described as "{documentDescription}" and that the attached copy is a true, exact, complete, and unaltered photocopy of said original document.

WITNESS my hand and official seal.

____________________________
{notaryName}
Notary Public, State of {state}
Commission No.: {commissionNumber}
My Commission Expires: {commissionExpiry}`,

  oath: `STATE OF {state}
COUNTY OF {county}

On {date}, before me, {notaryName}, personally appeared {signerName}, who being duly sworn (or affirmed), deposed and said the contents of the foregoing instrument subscribed by said person are true.

____________________________
{notaryName}
Notary Public, State of {state}
Commission No.: {commissionNumber}
My Commission Expires: {commissionExpiry}`,

  signature_witnessing: `STATE OF {state}
COUNTY OF {county}

On {date}, before me, {notaryName}, personally appeared {signerName}, personally known to me (or proved to me on the basis of satisfactory evidence) to be the person(s) whose name(s) is/are subscribed to the within instrument, and witnessed said person(s) sign the same.

____________________________
{notaryName}
Notary Public, State of {state}
Commission No.: {commissionNumber}
My Commission Expires: {commissionExpiry}`,
};

export function generateCertificateText(data: CertificateData): string {
  const template = CERTIFICATE_TEMPLATES[data.certificateType] || CERTIFICATE_TEMPLATES.acknowledgment;
  
  return template
    .replace(/{state}/g, data.stateName)
    .replace(/{county}/g, data.countyName)
    .replace(/{notaryName}/g, data.notaryName)
    .replace(/{commissionNumber}/g, data.commissionNumber)
    .replace(/{commissionExpiry}/g, data.commissionExpiry)
    .replace(/{signerName}/g, data.signerName)
    .replace(/{documentDescription}/g, data.documentDescription)
    .replace(/{date}/g, data.dateOfNotarization);
}

export function getAvailableCertificateTypes() {
  return [
    { value: "acknowledgment", label: "Acknowledgment", description: "Signer acknowledges signing the document" },
    { value: "jurat", label: "Jurat", description: "Signer swears or affirms content is true" },
    { value: "copy_certification", label: "Copy Certification", description: "Certify a copy matches the original" },
    { value: "oath", label: "Oath / Affirmation", description: "Administer an oath or affirmation" },
    { value: "signature_witnessing", label: "Signature Witnessing", description: "Witness the signing of a document" },
  ];
}
