import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Printer, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ohioForms = [
  {
    category: "Notary Commission",
    forms: [
      { title: "Application for Notary Public Commission", url: "https://www.ohiosos.gov/notary/forms/", desc: "Initial application to become a notary public in Ohio" },
      { title: "Notary Public Renewal Application", url: "https://www.ohiosos.gov/notary/forms/", desc: "Renewal of existing notary commission" },
      { title: "Change of Name/Address Form", url: "https://www.ohiosos.gov/notary/forms/", desc: "Update personal information on your commission" },
    ],
  },
  {
    category: "Notarial Certificates",
    forms: [
      { title: "Acknowledgment Certificate (Individual)", url: "https://www.ohiosos.gov/notary/forms/", desc: "Standard acknowledgment for individuals appearing before a notary (ORC §147.55)" },
      { title: "Jurat Certificate", url: "https://www.ohiosos.gov/notary/forms/", desc: "Certificate for sworn statements / affidavits (ORC §147.53)" },
      { title: "Copy Certification Certificate", url: "https://www.ohiosos.gov/notary/forms/", desc: "For certifying copies of documents (not vital records)" },
      { title: "Signature Witnessing Certificate", url: "https://www.ohiosos.gov/notary/forms/", desc: "Certificate for witnessing a signature" },
    ],
  },
  {
    category: "RON (Remote Online Notarization)",
    forms: [
      { title: "RON Commission Application", url: "https://www.ohiosos.gov/notary/remote-online-notarization/", desc: "Apply for authorization to perform remote online notarization" },
      { title: "RON Technology Provider Registration", url: "https://www.ohiosos.gov/notary/remote-online-notarization/", desc: "Register your RON platform with Ohio SOS" },
    ],
  },
];

const notarialCertTemplates = [
  {
    title: "Acknowledgment (Individual)",
    content: `State of Ohio, County of ___________

On this ___ day of _________, 20___, before me, the undersigned notary public, personally appeared _________________________, proved to me through satisfactory evidence of identification to be the person(s) whose name(s) is/are subscribed to the within instrument, and acknowledged to me that he/she/they executed the same for the purposes therein contained.

IN WITNESS WHEREOF, I have hereunto set my hand and official seal.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`,
  },
  {
    title: "Acknowledgment (Representative)",
    content: `State of Ohio, County of ___________

On this ___ day of _________, 20___, before me, the undersigned notary public, personally appeared _________________________, proved to me through satisfactory evidence of identification to be the person(s) whose name(s) is/are subscribed to the within instrument, and acknowledged to me that he/she/they executed the same in his/her/their authorized capacity(ies) as _____________ of _________________________ and that by his/her/their signature(s) on the instrument, the person(s), or the entity upon behalf of which the person(s) acted, executed the instrument.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`,
  },
  {
    title: "Jurat",
    content: `State of Ohio, County of ___________

Subscribed and sworn to (or affirmed) before me this ___ day of _________, 20___, by _________________________, proved to me on the basis of satisfactory evidence of identification to be the person(s) who appeared before me.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`,
  },
  {
    title: "Copy Certification",
    content: `State of Ohio, County of ___________

I certify that the attached is a true, exact, and unaltered copy of _________________________ presented to me by the document's custodian, _________________________, on this ___ day of _________, 20___.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`,
  },
];

export default function AdminTemplates() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Templates & Forms Library</h1>
        <p className="text-sm text-muted-foreground">Ohio notary forms, certificates, and document templates</p>
      </div>

      <Tabs defaultValue="ohio-forms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ohio-forms"><FileText className="mr-1 h-4 w-4" /> Ohio Forms</TabsTrigger>
          <TabsTrigger value="certificates"><BookOpen className="mr-1 h-4 w-4" /> Notarial Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="ohio-forms" className="space-y-6">
          {ohioForms.map((cat) => (
            <div key={cat.category}>
              <h2 className="font-display text-lg font-semibold mb-3">{cat.category}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {cat.forms.map((form) => (
                  <Card key={form.title} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{form.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{form.desc}</p>
                        </div>
                        <a href={form.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline"><ExternalLink className="h-3 w-3 mr-1" /> Open</Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">These are standard Ohio notarial certificate templates. Click "Print" to print on blank certificate paper.</p>
          {notarialCertTemplates.map((cert) => (
            <Card key={cert.title} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold">{cert.title}</h3>
                  <Button size="sm" variant="outline" onClick={() => {
                    const w = window.open("", "_blank");
                    if (w) {
                      w.document.write(`<html><head><title>${cert.title}</title><style>body{font-family:serif;padding:2rem;line-height:2;white-space:pre-wrap;max-width:700px;margin:0 auto}</style></head><body>${cert.content.replace(/\n/g, "<br/>")}</body></html>`);
                      w.document.close();
                      w.print();
                    }
                  }}><Printer className="h-3 w-3 mr-1" /> Print</Button>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-serif bg-muted/50 rounded-lg p-3">{cert.content}</pre>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
