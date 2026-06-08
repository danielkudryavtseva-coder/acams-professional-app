import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { Contact } from "../data/mockData";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  firm: z.string().min(1, "Firm is required"),
  role: z.string().min(1, "Role is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  linkedin: z.string().url("Invalid URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "do_not_contact"]),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface AddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (contact: Omit<Contact, "id" | "tags">) => void;
  defaultValues?: Partial<ContactFormValues>;
}

export function AddContactModal({ open, onOpenChange, onSave, defaultValues }: AddContactModalProps) {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { status: "active", ...defaultValues },
  });

  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const onSubmit = (data: ContactFormValues) => {
    onSave({
      ...data,
      email: data.email || undefined,
      linkedin: data.linkedin || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>Add a new contact to your network.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} placeholder="Full Name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firm">Firm *</Label>
              <Input id="firm" {...register("firm")} placeholder="Goldman Sachs" />
              {errors.firm && <p className="text-xs text-destructive">{errors.firm.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role *</Label>
            <Input id="role" {...register("role")} placeholder="VP, Investment Banking" />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="name@firm.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input id="linkedin" {...register("linkedin")} placeholder="https://linkedin.com/in/..." />
            {errors.linkedin && <p className="text-xs text-destructive">{errors.linkedin.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select defaultValue="active" onValueChange={(v) => setValue("status", v as ContactFormValues["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="do_not_contact">Do Not Contact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Meeting notes, context..." rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Contact</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName?: string;
  onConfirm: () => void;
}

export function DeleteContactModal({ open, onOpenChange, contactName, onConfirm }: DeleteContactModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Contact</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium">{contactName}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
