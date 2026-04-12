/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Notar verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>Notar<span style={logoDex}>Dex</span></Text>
        </Section>
        <Heading style={h1}>Verification code</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires shortly. If you didn't request this, ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#0f172a', fontFamily: "'Space Grotesk', 'Lato', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto', backgroundColor: '#1e293b', borderRadius: '16px' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '28px', fontWeight: 'bold' as const, color: '#f8fafc', margin: '0', display: 'inline' }
const logoDex = { color: '#f59e0b' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#f8fafc', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = {
  fontFamily: "'Space Grotesk', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#f59e0b',
  margin: '0 0 30px',
  textAlign: 'center' as const,
  letterSpacing: '4px',
}
const footer = { fontSize: '12px', color: '#64748b', margin: '30px 0 0', textAlign: 'center' as const }
