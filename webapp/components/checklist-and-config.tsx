"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Circle, CheckCircle, Loader2 } from "lucide-react";
import { PhoneNumber } from "@/components/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChecklistAndConfig({
  ready,
  setReady,
  selectedPhoneNumber,
  setSelectedPhoneNumber,
}: {
  ready: boolean;
  setReady: (val: boolean) => void;
  selectedPhoneNumber: string;
  setSelectedPhoneNumber: (val: string) => void;
}) {
  const [hasCredentials, setHasCredentials] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [currentNumberSid, setCurrentNumberSid] = useState("");
  const [currentVoiceUrl, setCurrentVoiceUrl] = useState("");

  const [publicUrl, setPublicUrl] = useState("");
  const [localServerUp, setLocalServerUp] = useState(false);
  const [publicUrlAccessible, setPublicUrlAccessible] = useState(false);

  const [allChecksPassed, setAllChecksPassed] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [ngrokLoading, setNgrokLoading] = useState(false);

  const appendedTwimlUrl = publicUrl ? `${publicUrl}/twiml` : "";
  const isWebhookMismatch =
    appendedTwimlUrl && currentVoiceUrl && appendedTwimlUrl !== currentVoiceUrl;

  useEffect(() => {
    const checks = [
      hasCredentials,
      phoneNumbers.length > 0,
      localServerUp,
      publicUrlAccessible,
      !!publicUrl && !isWebhookMismatch,
      !!currentNumberSid // Make sure a phone number is selected
    ];
    
    const passed = checks.every(Boolean);
    setAllChecksPassed(passed);
  }, [hasCredentials, phoneNumbers.length, localServerUp, publicUrlAccessible, publicUrl, isWebhookMismatch, currentNumberSid]);

  useEffect(() => {
    let polling = true;

    const pollChecks = async () => {
      try {
        // 1. Check credentials
        let res = await fetch("/api/twilio");
        if (!res.ok) throw new Error("Failed credentials check");
        const credData = await res.json();
        setHasCredentials(!!credData?.credentialsSet);

        // 2. Fetch numbers
        res = await fetch("/api/twilio/numbers");
        if (!res.ok) throw new Error("Failed to fetch phone numbers");
        const numbersData = await res.json();
        if (Array.isArray(numbersData) && numbersData.length > 0) {
          setPhoneNumbers(numbersData);
          // Only update if we have a currentNumberSid
          if (currentNumberSid) {
            const selected = numbersData.find((p: PhoneNumber) => p.sid === currentNumberSid);
            if (selected) {
              setCurrentVoiceUrl(selected.voiceUrl || "");
              setSelectedPhoneNumber(selected.friendlyName || "");
            }
          }
        }

        // 3. Check local server & public URL
        let foundPublicUrl = "";
        try {
          const resLocal = await fetch("http://localhost:8081/public-url");
          if (resLocal.ok) {
            const pubData = await resLocal.json();
            foundPublicUrl = pubData?.publicUrl || "";
            setLocalServerUp(true);
            setPublicUrl(foundPublicUrl);
          } else {
            throw new Error("Local server not responding");
          }
        } catch {
          setLocalServerUp(false);
          setPublicUrl("");
        }
      } catch (err) {
        console.error(err);
      }
    };

    pollChecks();
    const intervalId = setInterval(() => polling && pollChecks(), 1000);
    return () => {
      polling = false;
      clearInterval(intervalId);
    };
  }, [currentNumberSid, setSelectedPhoneNumber]);

  const updateWebhook = async () => {
    if (!currentNumberSid || !appendedTwimlUrl) return;
    try {
      setWebhookLoading(true);
      const res = await fetch("/api/twilio/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberSid: currentNumberSid,
          voiceUrl: appendedTwimlUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed to update webhook");
      const data = await res.json();
      setCurrentVoiceUrl(data.voiceUrl || appendedTwimlUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setWebhookLoading(false);
    }
  };

  const checkNgrok = async () => {
    if (!localServerUp || !publicUrl) return;
    setNgrokLoading(true);
    let success = false;
    for (let i = 0; i < 5; i++) {
      try {
        const resTest = await fetch(publicUrl + "/public-url");
        if (resTest.ok) {
          setPublicUrlAccessible(true);
          success = true;
          break;
        }
      } catch {
        // retry
      }
      if (i < 4) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    if (!success) {
      setPublicUrlAccessible(false);
    }
    setNgrokLoading(false);
  };

  const checklist = useMemo(() => {
    return [
      {
        label: "Set up Twilio account",
        done: hasCredentials,
        description: "Then update account details in webapp/.env",
        field: (
          <Button
            className="w-full"
            onClick={() => window.open("https://console.twilio.com/", "_blank")}
          >
            Open Twilio Console
          </Button>
        ),
      },
      {
        label: "Set up Twilio phone number",
        done: phoneNumbers.length > 0,
        description: "Costs around $1.15/month",
        field:
          phoneNumbers.length > 0 ? (
            phoneNumbers.length === 1 ? (
              <Input value={phoneNumbers[0].friendlyName || ""} disabled />
            ) : (
              <Select
                onValueChange={(value) => {
                  setCurrentNumberSid(value);
                  const selected = phoneNumbers.find((p) => p.sid === value);
                  if (selected) {
                    setSelectedPhoneNumber(selected.friendlyName || "");
                    setCurrentVoiceUrl(selected.voiceUrl || "");
                  }
                }}
                value={currentNumberSid}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a phone number" />
                </SelectTrigger>
                <SelectContent>
                  {phoneNumbers.map((phone) => (
                    <SelectItem key={phone.sid} value={phone.sid}>
                      {phone.friendlyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          ) : (
            <Button
              className="w-full"
              onClick={() =>
                window.open(
                  "https://console.twilio.com/us1/develop/phone-numbers/manage/incoming",
                  "_blank"
                )
              }
            >
              Set up Twilio phone number
            </Button>
          ),
      },
      {
        label: "Start local WebSocket server",
        done: localServerUp,
        description: "cd websocket-server && npm run dev",
        field: null,
      },
      {
        label: "Start ngrok",
        done: publicUrlAccessible,
        description: "Then set ngrok URL in websocket-server/.env",
        field: (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1">
              <Input value={publicUrl} disabled />
            </div>
            <div className="flex-1">
              <Button
                variant="outline"
                onClick={checkNgrok}
                disabled={ngrokLoading || !localServerUp || !publicUrl}
                className="w-full"
              >
                {ngrokLoading ? (
                  <Loader2 className="mr-2 h-4 animate-spin" />
                ) : (
                  "Check ngrok"
                )}
              </Button>
            </div>
          </div>
        ),
      },
      {
        label: "Update Twilio webhook URL",
        done: !!publicUrl && !isWebhookMismatch,
        description: "Can also be done manually in Twilio console",
        field: (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1">
              <Input value={appendedTwimlUrl} disabled />
            </div>
            <div className="flex-1">
              <Button
                variant="outline"
                onClick={updateWebhook}
                disabled={
                  webhookLoading ||
                  !currentNumberSid ||
                  !appendedTwimlUrl ||
                  currentVoiceUrl === appendedTwimlUrl
                }
                className="w-full"
              >
                {webhookLoading ? (
                  <Loader2 className="mr-2 h-4 animate-spin" />
                ) : (
                  "Update webhook"
                )}
              </Button>
            </div>
          </div>
        ),
      },
    ];
  }, [
    hasCredentials,
    phoneNumbers,
    currentNumberSid,
    publicUrl,
    localServerUp,
    publicUrlAccessible,
    webhookLoading,
    ngrokLoading,
    appendedTwimlUrl,
    isWebhookMismatch,
  ]);

  return (
    <Dialog open={!ready} onOpenChange={setReady}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Setup Checklist</DialogTitle>
          <DialogDescription>
            Complete these steps to start using the app
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {checklist.map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                {item.done ? (
                  <CheckCircle className="text-green-500 w-4 h-4" />
                ) : (
                  <Circle className="text-gray-400 w-4 h-4" />
                )}
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="text-sm text-gray-500 ml-6">
                {item.description}
              </div>
              {item.field && <div className="ml-6">{item.field}</div>}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setReady(true)} disabled={!allChecksPassed}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
