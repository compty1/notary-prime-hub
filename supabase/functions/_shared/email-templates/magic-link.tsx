/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Notar login link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>Notar<span style={logoDex}>Dex</span></Text>
        </Section>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Click below to log in to Notar. This link expires shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Log In to Notar
        </Button>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#0f172a', fontFamily: "'Space Grotesk', 'Lato', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto', backgroundColor: '#1e293b', borderRadius: '16px' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '28px', fontWeight: 'bold' as const, color: '#f8fafc', margin: '0', display: 'inline' }
const logoDex = { color: '#f59e0b' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#f8fafc', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 24px' }
const button = {
  backgroundColor: '#f59e0b',
  color: '#0f172a',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '10px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'block' as const,
  textAlign: 'center' as const,
}
const footer = { fontSize: '12px', color: '#64748b', margin: '30px 0 0', textAlign: 'center' as const }
