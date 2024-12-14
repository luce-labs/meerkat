import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Copy, FileCode, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DatePicker } from "@/app/(landing)/date-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";

const formSchema = z.object({
  hostEmail: z.string().email("Invalid email"),
  roomName: z.string().min(1, "Room name is required"),
  startDateTime: z.coerce.date(),
  controlMicrophone: z.boolean().default(false),
  allowPasting: z.boolean().default(false),
  boilerplateCode: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface ConfigureMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigureMeetingModal = ({
  isOpen: isModalOpen,
  onClose,
}: ConfigureMeetingModalProps) => {
  const router = useRouter();
  const createRoomMutation = api.room.create.useMutation({
    onSuccess: () => {
      setIsCardOpen(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomName: "",
      hostEmail: "",
      startDateTime: undefined,
      controlMicrophone: false,
      allowPasting: false,
      boilerplateCode: "",
    },
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const onSubmit = (data: FormSchema) => {
    toast.promise(createRoomMutation.mutateAsync(data), {
      loading: "Creating room...",
      success: "Room created!",
      error: "Error creating room",
    });
  };

  return (
    <>
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          onClose();
          setTimeout(() => {
            if (!open) {
              document.body.style.pointerEvents = "";
            }
          }, 100);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Your Room</DialogTitle>
            <DialogDescription>
              Customize your collaborative coding environment. These settings
              will apply to joining participants.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="hostEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>host Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., example@mmail.com"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roomName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., mock-interview"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      This name will be visible to all participants
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="startDateTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <div>
                        <FormLabel>Start Date</FormLabel>
                        <FormDescription>
                          Select when the meeting will start
                        </FormDescription>
                      </div>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onDateChange={(date) => field.onChange(date)}
                          placeholder="Select start date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Controls Section */}
              <div className="space-y-4">
                {/* Audio Control */}
                <FormField
                  control={form.control}
                  name="controlMicrophone"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border bg-card p-4">
                      <div className="flex items-center justify-between space-x-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mic className="h-4 w-4 text-muted-foreground" />
                            <FormLabel className="font-medium">
                              Audio Control *
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Allow participants to control their microphone
                            settings
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Paste Control */}
                <FormField
                  control={form.control}
                  name="allowPasting"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border bg-card p-4">
                      <div className="flex items-center justify-between space-x-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Copy className="h-4 w-4 text-muted-foreground" />
                            <FormLabel className="font-medium">
                              Code Pasting *
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Enable code pasting functionality for all
                            participants
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Programming Environment */}
              <div className="space-y-4 rounded-lg border p-4">
                <div
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <h3 className="font-medium">Programming Environment</h3>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="boilerplateCode"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <FileCode className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>Starter Code</FormLabel>
                              </div>
                              <FormControl>
                                <Textarea
                                  placeholder="// Starting code in editor..."
                                  className="h-32 resize-none font-mono"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <DialogFooter className="w-full">
                <Button
                  type="submit"
                  disabled={createRoomMutation.isPending}
                  className="w-full"
                >
                  {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/*  This modal should check email messaging, and add a button to retry sending  if necessary*/}
      {/*  if it fails */}
      {isCardOpen && (
        <div className="pointer-events-auto">
          <AlertDialog open={isCardOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle></AlertDialogTitle>
                <AlertDialogDescription>
                  Email sent to participants of the meeting.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setIsCardOpen(false);
                    onClose();
                  }}
                >
                  Close
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </>
  );
};

export default ConfigureMeetingModal;
