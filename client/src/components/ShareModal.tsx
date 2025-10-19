import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Mail, Facebook, Twitter } from "lucide-react";
import { SiPinterest } from "react-icons/si";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: {
    id: string;
    title: string;
    imageUrl?: string;
  };
}

export function ShareModal({ isOpen, onClose, recipe }: ShareModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const recipeUrl = `${window.location.origin}/recipe/${recipe.id}`;
  const encodedUrl = encodeURIComponent(recipeUrl);
  const encodedTitle = encodeURIComponent(recipe.title);
  const encodedImage = recipe.imageUrl ? encodeURIComponent(recipe.imageUrl) : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(recipeUrl);
      toast({
        title: "Link copied!",
        description: "Recipe link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleEmailShare = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          email,
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');

      toast({
        title: "Email sent!",
        description: `Recipe shared with ${email}`,
      });
      setEmail("");
      onClose();
    } catch (error) {
      toast({
        title: "Failed to send",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const socialLinks = [
    {
      name: "Pinterest",
      icon: SiPinterest,
      color: "hover:bg-[#E60023]/10 hover:text-[#E60023]",
      url: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`,
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]",
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-light tracking-tight">
            Share Recipe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              Copy Link
            </label>
            <div className="flex gap-2">
              <Input
                value={recipeUrl}
                readOnly
                className="flex-1"
                data-testid="input-share-link"
              />
              <Button 
                onClick={handleCopyLink} 
                size="icon"
                variant="outline"
                data-testid="button-copy-link"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Email Share */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              Share via Email
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                data-testid="input-share-email"
              />
              <Button 
                onClick={handleEmailShare}
                disabled={isSendingEmail}
                size="icon"
                variant="outline"
                data-testid="button-send-email"
              >
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              Share on Social Media
            </label>
            <div className="grid grid-cols-3 gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`button-share-${social.name.toLowerCase()}`}
                >
                  <Button
                    variant="outline"
                    className={`w-full gap-2 transition-colors ${social.color}`}
                  >
                    <social.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{social.name}</span>
                  </Button>
                </a>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
