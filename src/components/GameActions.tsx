"use client";

import { Button } from "@/components/ui/Button";
import { Upload, BookOpen } from "lucide-react";

export function GameActions() {
    return (
        <div className="flex flex-wrap gap-4 mt-4 relative z-50 pointer-events-auto">
            <Button
                size="lg"
                className="font-bold text-lg cursor-pointer"
                onClick={() => alert("Score Submission Flow - Coming Soon!")}
            >
                <Upload className="w-5 h-5 mr-2" />
                Submit High Score
            </Button>
            <Button
                variant="outline"
                size="lg"
                className="backdrop-blur-md cursor-pointer"
                onClick={() => alert("Rules Modal - Coming Soon!")}
            >
                <BookOpen className="w-5 h-5 mr-2" />
                View Rules
            </Button>
        </div>
    );
}
