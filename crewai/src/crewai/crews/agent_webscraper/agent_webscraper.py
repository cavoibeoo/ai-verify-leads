from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
import json
from crewai_tools import ScrapeWebsiteTool


@CrewBase
class WebScraperCrew:

    scrape_website_tool = ScrapeWebsiteTool(
        max_depth=2,
        max_pages=10,
        max_concurrent_requests=5,
        max_retries=3,
        timeout=10,
    )

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def web_scraper_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["web_scraper_agent"],
            tools=[self.scrape_website_tool],
        )

    @agent
    def criteria_analyzer_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["criteria_analyzer_agent"],
        )

    @task
    def scrape_website(self) -> Task:
        return Task(
            config=self.tasks_config["scrape_website"],
        )

    @task
    def analyze_content(self) -> Task:
        return Task(
            config=self.tasks_config["analyze_content"],
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

class WebScraper:
    def __init__(self):
        self.scraper_crew = WebScraperCrew()

    def scrape_and_analyze(self, url: str, prompt_criteria: str):
        try:
            result = self.scraper_crew.crew().kickoff(
                inputs={
                    "website_url": url,
                    "prompt_criteria": prompt_criteria
                }
            )

            if hasattr(result, 'raw_output'):
                result_str = result.raw_output
            else:
                result_str = str(result)
                
            try:
                result_json = json.loads(result_str)
                return result_json
            except json.JSONDecodeError:
                return {"result": result_str}

        except Exception as e:
            return {
                "error": "Failed to scrape and analyze",
                "message": str(e)
            }
