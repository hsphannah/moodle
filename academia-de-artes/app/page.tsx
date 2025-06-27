"use client"

import { useState } from "react"
import Header from "@/components/dashboard/Header"
import Sidebar from "@/components/dashboard/Sidebar"
import DashboardTab from "@/components/dashboard/DashboardTab"
import CursosTab from "@/components/dashboard/CursosTab"
import AlunosTab from "@/components/dashboard/AlunosTab"
import AulasTab from "@/components/dashboard/AulasTab"
import ConteudoTab from "@/components/dashboard/ConteudoTab"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard")

  // Por enquanto, os dados ainda moram aqui. O próximo passo seria tirá-los daqui.
  const cursos = [
    {
      id: 1,
      nome: "Pintura em Tela",
      descricao: "Curso completo de pintura em tela para iniciantes",
      alunos: 24,
      aulas: 12,
      progresso: 75,
      status: "Ativo",
      cor: "bg-blue-500",
    },
    {
      id: 2,
      nome: "Escultura em Argila",
      descricao: "Técnicas básicas e avançadas de escultura",
      alunos: 18,
      aulas: 8,
      progresso: 60,
      status: "Ativo",
      cor: "bg-green-500",
    },
    {
      id: 3,
      nome: "Desenho Artístico",
      descricao: "Fundamentos do desenho e técnicas de sombreamento",
      alunos: 32,
      aulas: 15,
      progresso: 90,
      status: "Ativo",
      cor: "bg-purple-500",
    },
  ]

  const alunos = [
    {
      id: 1,
      nome: "Maria Silva",
      email: "maria@email.com",
      curso: "Pintura em Tela",
      progresso: 85,
      ultimoAcesso: "Hoje",
      status: "Ativo",
    },
    {
      id: 2,
      nome: "João Santos",
      email: "joao@email.com",
      curso: "Escultura em Argila",
      progresso: 70,
      ultimoAcesso: "Ontem",
      status: "Ativo",
    },
    {
      id: 3,
      nome: "Ana Costa",
      email: "ana@email.com",
      curso: "Desenho Artístico",
      progresso: 95,
      ultimoAcesso: "2 dias atrás",
      status: "Ativo",
    },
  ]

  const aulas = [
    {
      id: 1,
      titulo: "Introdução às Cores Primárias",
      curso: "Pintura em Tela",
      duracao: "45 min",
      tipo: "Vídeo",
      visualizacoes: 24,
      data: "2024-01-15",
    },
    {
      id: 2,
      titulo: "Técnicas de Mistura de Cores",
      curso: "Pintura em Tela",
      duracao: "60 min",
      tipo: "Vídeo",
      visualizacoes: 22,
      data: "2024-01-18",
    },
    {
      id: 3,
      titulo: "Preparação da Argila",
      curso: "Escultura em Argila",
      duracao: "30 min",
      tipo: "PDF",
      visualizacoes: 18,
      data: "2024-01-20",
    },
  ]

  // Função para renderizar a aba ativa. Deixa o return principal mais limpo.
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab cursos={cursos} alunos={alunos} />
      case "cursos":
        return <CursosTab cursos={cursos} />
      case "alunos":
        return <AlunosTab alunos={alunos} />
      case "aulas":
        return <AulasTab aulas={aulas} />
      case "conteudo":
        return <ConteudoTab />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-6">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  )
}