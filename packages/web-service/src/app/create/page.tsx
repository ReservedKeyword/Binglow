"use client";

import { CreateBoardForm, type CreateBoardFormData } from "@binglow/web-service/components/CreateBoardForm";
import { LoadingDisplay } from "@binglow/web-service/components/LoadingDisplay";
import { rpcClient } from "@binglow/web-service/trpc/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const CreatePage = () => {
  const router = useRouter();
  const { data: currentSession, status: sessionStatus } = useSession();

  const createBoardTemplateMutation = rpcClient.boardTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("Board template saved!");
      router.push("/my-boards");
    },
    onError: (error) => toast.error(`Could not save template: ${error.message}`)
  });

  const handleSaveTemplate = (data: CreateBoardFormData) => {
    const tiles = data.tiles.filter(Boolean);

    if (!data.title.trim()) {
      toast.error("Enter a title for your board.");
      return;
    }

    if (!data.slug.trim()) {
      toast.error("Enter a unique slug for your board.");
      return;
    }

    if (tiles.length < 24) {
      toast.error("You need at least 24 options for a 5x5 bingo board.");
      return;
    }

    createBoardTemplateMutation.mutate(data);
  };

  if (sessionStatus === "loading") {
    return <LoadingDisplay message="Loading Session..." />;
  }

  if (sessionStatus === "unauthenticated" || !currentSession?.user) {
    router.push("/login");
    return null;
  }

  return <CreateBoardForm isSaving={createBoardTemplateMutation.isPending} onSave={handleSaveTemplate} />;
};

export default CreatePage;
