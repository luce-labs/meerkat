import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function MeerkatMeetingEmail({
  scheduledDate = "December 15, 2024",
  scheduledTime = "10:00 AM EST",
  roomLink = "#",
}: {
  scheduledDate: string;
  scheduledTime: string;
  roomLink: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your Meerkat Collaboration Room is Ready</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Logo */}
          <Img
            src="[Your Meerkat Logo URL]"
            alt="Meerkat"
            width={150}
            height={50}
            style={styles.logo}
          />

          {/* Main Content */}
          <Heading style={styles.heading}>
            Your Collaboration Room is Ready
          </Heading>

          <Text style={styles.text}>Hi there,</Text>

          <Text style={styles.text}>
            Your Meerkat collaboration room has been scheduled and is ready to
            go!
          </Text>

          {/* Meeting Details */}
          <Section style={styles.detailsSection}>
            <Heading as="h2" style={styles.subheading}>
              Meeting Details
            </Heading>
            <Text style={styles.detail}>Date: {scheduledDate}</Text>
            <Text style={styles.detail}>Time: {scheduledTime}</Text>
            <Text style={styles.detail}>Link: {roomLink}</Text>
          </Section>

          {/* Join Button */}
          <Button href={roomLink} style={styles.button}>
            Join Room
          </Button>

          <Hr style={styles.hr} />

          {/* Quick Tips */}
          <Heading as="h2" style={styles.subheading}>
            Quick Tips
          </Heading>
          <Text style={styles.text}>
            • You can join the room 5 minutes before the scheduled time
          </Text>
          <Text style={styles.text}>
            • All participants can access the room using the same link
          </Text>
          <Text style={styles.text}>
            • No downloads required - everything runs in your browser
          </Text>

          {/* Support */}
          <Text style={styles.support}>
            Need help? Reply to this email or visit our support center at{" "}
            <Link href="https://support.meerkat.com" style={styles.link}>
              support.meerkat.com
            </Link>
          </Text>

          {/* Footer */}
          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            This is an automated message from Meerkat - Where Code Collaboration
            Happens
          </Text>
          <Text style={styles.footer}>
            © 2024 Meerkat. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    margin: "0 auto",
    padding: "20px 0 48px",
    width: "560px",
  },
  logo: {
    margin: "0 auto",
  },
  heading: {
    color: "#484848",
    fontSize: "24px",
    fontWeight: "600",
    lineHeight: "1.4",
    textAlign: "center" as const, // Type fix
    margin: "30px 0",
  },
  subheading: {
    color: "#484848",
    fontSize: "18px",
    fontWeight: "600",
    lineHeight: "1.4",
    margin: "16px 0",
  },
  text: {
    color: "#484848",
    fontSize: "16px",
    lineHeight: "24px",
    marginBottom: "12px",
  },
  detailsSection: {
    backgroundColor: "#f8f9fa",
    borderLeft: "4px solid #3B82F6",
    padding: "16px",
    marginBottom: "24px",
  },
  detail: {
    margin: "8px 0",
    fontSize: "14px",
    color: "#484848",
  },
  button: {
    backgroundColor: "#3B82F6",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const, // Type fix
    margin: "16px 0 24px",
    padding: "12px 24px",
    width: "100%",
  },
  support: {
    fontSize: "14px",
    color: "#666666",
    marginTop: "24px",
  },
  link: {
    color: "#3B82F6",
    textDecoration: "none",
  },
  hr: {
    borderColor: "#e6ebf1",
    margin: "20px 0",
  },
  footer: {
    color: "#666666",
    fontSize: "12px",
    lineHeight: "16px",
    textAlign: "center" as const, // Type fix
  },
};
