"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import MonacoEditor from "@monaco-editor/react";
import { api } from "@/trpc/react";

export default function ConfigureMeetingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [roomName, setRoomName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [language, setLanguage] = useState("");
  const [muting, setMuting] = useState(false);
  const [allowPasting, setAllowPasting] = useState(false);
  const [boilerplateCode, setBoilerplateCode] = useState("");

  const createRoom = api.room.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const roomData = {
        roomName,
        maxParticipants,
        programmingLanguage: language,
        controlMicrophone: muting,
        allowPasting,
        boilerplateCode,
        createdAt: new Date().toISOString(),
        participantsJoined: 3,
      };
      await createRoom.mutateAsync(roomData);
      onClose();
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Meeting</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                min="1"
              />
            </div>

            <div>
              <Label>Programming Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Muting/Unmuting</Label>
              <Switch checked={muting} onCheckedChange={setMuting} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Allow Pasting</Label>
              <Switch
                checked={allowPasting}
                onCheckedChange={setAllowPasting}
              />
            </div>

            <div>
              <Label className="mb-2 block">Boilerplate Code</Label>
              <MonacoEditor
                height="300px"
                width="100%"
                language={language || "javascript"}
                value={boilerplateCode}
                onChange={(value) => setBoilerplateCode(value || "")}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                }}
              />
            </div>
          </div>

          <Button
            className="mt-4 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
            type="submit"
          >
            Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
