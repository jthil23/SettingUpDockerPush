import {
  getSessionStatus,
  getLivePositions,
  getLiveIntervals,
  getDriverNumbers,
  getRaceControlMessages,
  getWeatherData,
} from "@/lib/api/openf1";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        const session = await getSessionStatus();

        if (!session) {
          send({ active: false });
          controller.close();
          return;
        }

        const now = new Date();
        const startDate = session.date_start ? new Date(session.date_start) : null;
        const endDate = session.date_end ? new Date(session.date_end) : null;

        const isLive =
          startDate !== null &&
          startDate <= now &&
          (endDate === null || endDate >= now);

        if (!isLive) {
          send({ active: false });
          controller.close();
          return;
        }

        const drivers = await getDriverNumbers(session.session_key);
        const driverMap = new Map(
          drivers.map((d) => [
            d.driver_number,
            {
              number: d.driver_number,
              abbreviation: d.name_acronym,
              fullName: d.full_name,
              teamName: d.team_name,
              teamColour: d.team_colour,
            },
          ])
        );

        let lastRaceControlDate = "";

        const MAX_ITERATIONS = 60;
        let iteration = 0;

        async function poll() {
          if (iteration >= MAX_ITERATIONS) {
            send({ active: false, reason: "timeout" });
            controller.close();
            return;
          }

          try {
            const [positions, intervals, raceControl, weather] = await Promise.all([
              getLivePositions(session!.session_key),
              getLiveIntervals(session!.session_key),
              getRaceControlMessages(session!.session_key),
              getWeatherData(session!.session_key),
            ]);

            const latestPositions = new Map<number, { position: number; date: string }>();
            for (const p of positions) {
              const existing = latestPositions.get(p.driver_number);
              if (!existing || p.date > existing.date) {
                latestPositions.set(p.driver_number, { position: p.position, date: p.date });
              }
            }

            const latestIntervals = new Map<number, { gapToLeader: number | null; interval: number | null; date: string }>();
            for (const i of intervals) {
              const existing = latestIntervals.get(i.driver_number);
              if (!existing || i.date > existing.date) {
                latestIntervals.set(i.driver_number, {
                  gapToLeader: i.gap_to_leader,
                  interval: i.interval,
                  date: i.date,
                });
              }
            }

            const sortedDrivers = Array.from(latestPositions.entries())
              .sort((a, b) => a[1].position - b[1].position)
              .map(([driverNumber, pos]) => {
                const driver = driverMap.get(driverNumber);
                const interval = latestIntervals.get(driverNumber);
                return {
                  position: pos.position,
                  driverNumber,
                  abbreviation: driver?.abbreviation ?? `#${driverNumber}`,
                  fullName: driver?.fullName ?? `Driver ${driverNumber}`,
                  teamName: driver?.teamName ?? "",
                  teamColour: driver?.teamColour ?? null,
                  gapToLeader: interval?.gapToLeader ?? null,
                  interval: interval?.interval ?? null,
                };
              });

            const newRaceControl = raceControl
              .filter((rc) => rc.date > lastRaceControlDate)
              .map((rc) => ({
                date: rc.date,
                category: rc.category,
                flag: rc.flag,
                message: rc.message,
                driverNumber: rc.driver_number,
                lapNumber: rc.lap_number,
                scope: rc.scope,
              }));

            if (newRaceControl.length > 0) {
              lastRaceControlDate = newRaceControl[newRaceControl.length - 1].date;
            }

            const latestWeather = weather.length > 0 ? weather[weather.length - 1] : null;
            const weatherData = latestWeather ? {
              airTemp: latestWeather.air_temperature,
              trackTemp: latestWeather.track_temperature,
              humidity: latestWeather.humidity,
              windSpeed: latestWeather.wind_speed,
              windDirection: latestWeather.wind_direction,
              rainfall: latestWeather.rainfall,
            } : null;

            send({
              active: true,
              sessionName: session!.session_name || session!.session_type || "Session",
              meetingName: session!.meeting_name,
              positions: sortedDrivers,
              raceControl: newRaceControl,
              weather: weatherData,
            });
          } catch {
            send({ active: true, heartbeat: true });
          }

          iteration++;
          setTimeout(poll, 5000);
        }

        await poll();
      } catch {
        send({ active: false, error: "Server error" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
