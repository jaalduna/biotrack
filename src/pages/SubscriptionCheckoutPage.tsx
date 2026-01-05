import { useState } from "react";
import { subscriptionsApi } from "@/services/Api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SubscriptionCheckoutPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: "basic" | "premium") => {
    setLoading(plan);
    setError(null);

    try {
      const { url } = await subscriptionsApi.createCheckout(plan);
      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create checkout session");
      setLoading(null);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Start with a 14-day free trial. No credit card required.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Plan */}
        <Card className="relative">
          <CardHeader>
            <CardTitle>Basic Plan</CardTitle>
            <CardDescription>Perfect for small teams</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Up to 5 team members</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Patient management</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Treatment tracking</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Basic diagnostics</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Email support</span>
              </li>
            </ul>
            <Button
              className="w-full mt-6"
              onClick={() => handleCheckout("basic")}
              disabled={loading !== null}
            >
              {loading === "basic" ? "Processing..." : "Start Free Trial"}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-primary">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
              POPULAR
            </span>
          </div>
          <CardHeader>
            <CardTitle>Premium Plan</CardTitle>
            <CardDescription>For growing teams</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$19.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Up to 15 team members</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Everything in Basic</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Priority support</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Custom workflows</span>
              </li>
            </ul>
            <Button
              className="w-full mt-6"
              onClick={() => handleCheckout("premium")}
              disabled={loading !== null}
            >
              {loading === "premium" ? "Processing..." : "Start Free Trial"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>14-day free trial • Cancel anytime • No credit card required for trial</p>
      </div>
    </div>
  );
}
