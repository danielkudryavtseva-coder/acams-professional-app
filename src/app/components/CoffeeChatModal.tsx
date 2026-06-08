import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useAuth } from "../context/AuthContext";
import { useConnect } from "../context/ConnectContext";

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM",
];

interface CoffeeChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alumniId: string;
  alumniName: string;
}

export function CoffeeChatModal({ open, onOpenChange, alumniId, alumniName }: CoffeeChatModalProps) {
  const { currentUser } = useAuth();
  const { addBooking } = useConnect();
  const [date, setDate] = React.useState<Date | undefined>();
  const [time, setTime] = React.useState("");
  const [message, setMessage] = React.useState("");

  const submit = () => {
    if (!currentUser || !date || !time) return;
    addBooking({
      memberId: currentUser.id,
      alumniId,
      requestedDate: `${format(date, "yyyy-MM-dd")} ${time}`,
      message,
      status: "pending",
    });
    onOpenChange(false);
    setDate(undefined);
    setTime("");
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Coffee Chat with {alumniName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger><SelectValue placeholder="Select a time" /></SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Introduce yourself and suggest talking points..." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-[#c63f60] hover:bg-[#c63f60]" disabled={!date || !time} onClick={submit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
