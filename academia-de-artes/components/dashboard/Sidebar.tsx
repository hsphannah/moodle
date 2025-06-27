"use client"

import {
  BookOpen,
  Users,
  BarChart3,
  Upload,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Definimos as "propriedades" que nosso componente vai receber
interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        <Button
          variant={activeTab === "dashboard" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveTab("dashboard")}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={activeTab === "cursos" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveTab("cursos")}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Cursos
        </Button>
        <Button
          variant={activeTab === "alunos" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveTab("alunos")}
        >
          <Users className="mr-2 h-4 w-4" />
          Alunos
        </Button>
        <Button
          variant={activeTab === "aulas" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveTab("aulas")}
        >
          <Play className="mr-2 h-4 w-4" />
          Aulas
        </Button>
        <Button
          variant={activeTab === "conteudo" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveTab("conteudo")}
        >
          <Upload className="mr-2 h-4 w-4" />
          Conteúdo
        </Button>
      </nav>
    </aside>
  )
}