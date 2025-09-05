import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Case } from "@shared/schema";
import { useAuth } from "react-oidc-context";
import { CaseFormModal } from "../case/case-form-modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Info } from "lucide-react";
import { useCases } from "@/hooks/useCases";

const diaryEntryFormSchema = z.object({
  caseId: z.string().min(1, "Case selection is required"),
  entryDate: z.string().min(1, "Entry date is required"),
  hearingSummary: z.string().optional(),
  remarks: z.string().optional(),
  nextHearingDate: z.string().optional(),
  isSharedWithChamber: z.boolean().default(false),
});

type DiaryEntryFormData = z.infer<typeof diaryEntryFormSchema>;

interface DiaryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string | null;
  onSuccess?: () => void;
}

export function DiaryEntryModal({ isOpen, onClose, caseId, onSuccess }: DiaryEntryModalProps) {
  const [showCaseModal, setShowCaseModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { cases, isLoading, error } = useCases();
   const auth = useAuth();
    const token = auth.user?.id_token; // or access_token depending on your config

  // const { data: cases = [] } = useQuery<Case[]>({
  //   queryKey: ["/api/cases"],
  // });

  const form = useForm<DiaryEntryFormData>({
    resolver: zodResolver(diaryEntryFormSchema),
    defaultValues: {
      caseId: caseId || "",
      entryDate: new Date().toISOString().split('T')[0],
      hearingSummary: "",
      remarks: "",
      nextHearingDate: new Date().toISOString(),
      isSharedWithChamber: false,
    },
  });

  const createDiaryEntryMutation = useMutation({
    mutationFn: async (data: DiaryEntryFormData) => {
      const response = await apiRequest("POST", "/api/diary-entries", data, token);
      return response.json();
    },
    onSuccess: async (newEntry) => {
       // Force an immediate refetch instead of waiting for cache state
      await queryClient.invalidateQueries({ queryKey: ["/api/calendar/hearings"], refetchType: "active" });
      await queryClient.invalidateQueries({ queryKey: ["/api/cases"], refetchType: "active" });
      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("diaryEntryId", newEntry.id);

        await apiRequest("POST", "/api/documents", formData, token);
      }
      if (onSuccess) onSuccess();
      toast({
        title: "Success",
        description: "Diary entry created successfully",
      });
      
      form.reset();
      setSelectedFile(null);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create diary entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DiaryEntryFormData) => {
    createDiaryEntryMutation.mutate(data);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Diary Entry</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            

            <FormField
              control={form.control}
              name="entryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="caseId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-1">
                  <FormLabel>Select Case Title</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs break-words whitespace-normal">
                        <p>You must select or create a case before adding a diary entry.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                  <Select
                    onValueChange={(value) => {
                      if (value === "new") {
                        setShowCaseModal(true); // open modal
                      } else {
                        field.onChange(value);
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a case" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cases.map((caseItem:any) => (
                        <SelectItem key={caseItem.id} value={caseItem.id}>
                          {caseItem.title}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">➕ Add New Case</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hearingSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proceedings Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief summary of today's proceedings..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks & Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed notes, observations, action items..."
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextHearingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Hearing Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Attachment */}
            <div>
              <FormLabel>Attach Documents</FormLabel>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center mt-2">
                <i className="fas fa-cloud-upload-alt text-2xl text-slate-400 mb-2"></i>
                <p className="text-sm text-slate-600 mb-2">
                  {selectedFile ? selectedFile.name : "Tap to upload files"}
                </p>
                <p className="text-xs text-slate-500 mb-2">PDF, Images (Max 10MB)</p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Choose File
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="isSharedWithChamber"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Share with Chamber</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Allow colleagues to view this entry
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
                disabled={createDiaryEntryMutation.isPending}
              >
                {createDiaryEntryMutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
      {/* Case Form Modal */}
      <CaseFormModal
        isOpen={showCaseModal}
        onClose={() => setShowCaseModal(false)}
      />
    </Dialog>
  );
}
