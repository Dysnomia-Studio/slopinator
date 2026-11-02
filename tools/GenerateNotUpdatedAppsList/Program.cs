using SteamKit2;

using System.Text.Json;

const int BatchSize = 100;
const int MaxAttempts = 3;

List<uint> appIds = JsonSerializer.Deserialize<List<uint>>(await File.ReadAllTextAsync("steam_app_before_gpt.json"))!;
appIds.Sort();
// TODO: test all public apps as well
Console.WriteLine($"Found {appIds.Count} app ids.");

var client = new SteamClient();
var manager = new CallbackManager(client);
var user = client.GetHandler<SteamUser>()!;
var apps = client.GetHandler<SteamApps>()!;

var loggedOn = new TaskCompletionSource();
var running = true;

manager.Subscribe<SteamClient.ConnectedCallback>(_ => user.LogOnAnonymous());
manager.Subscribe<SteamClient.DisconnectedCallback>(_ => {
    running = false;
    loggedOn.TrySetException(new Exception("Disconnected from Steam."));
});
manager.Subscribe<SteamUser.LoggedOnCallback>(cb => {
    if (cb.Result == EResult.OK) loggedOn.TrySetResult();
    else loggedOn.TrySetException(new Exception($"Logon failed: {cb.Result}"));
});

client.Connect();
_ = Task.Run(() => { while (running) manager.RunWaitCallbacks(TimeSpan.FromSeconds(1)); });
await loggedOn.Task;
Console.WriteLine("Logged on anonymously.");

var lastUpdate = new Dictionary<uint, DateTime>();
List<uint> doneIds = [];
var totalCount = appIds.Count;

while (appIds.Count != 0) {
    var batch = appIds.Take(BatchSize).ToList();

    try {
        var tokens = await Retry(() => {
            var job = apps.PICSGetAccessTokens(batch, []);
            job.Timeout = TimeSpan.FromSeconds(60);
            return job.ToTask();
        });

        var requests = tokens.AppTokens.Select((x) => new SteamApps.PICSRequest(x.Key) {
            AccessToken = x.Value
        });

        var info = await Retry(() => {
            var job = apps.PICSGetProductInfo(requests, []);
            job.Timeout = TimeSpan.FromSeconds(120);
            return job.ToTask();
        });

        foreach (var result in info.Results ?? []) {
            foreach (var (id, app) in result.Apps) {
                doneIds.Add(id);
                var pub = app.KeyValues["depots"]["branches"]["public"];
                var raw = pub["timeupdated"].Value;
                if (raw is null || !long.TryParse(raw, out var unix)) continue; // no default branch / no data

                lastUpdate[id] = DateTimeOffset.FromUnixTimeSeconds(unix).UtcDateTime;
            }
        }
    } catch (Exception ex) {
        Console.WriteLine($"Batch starting at {batch[0]} failed: {ex.Message}");
    }

    appIds = appIds.Where((x) => !doneIds.Contains(x)).Shuffle().ToList();

    Console.WriteLine($"{doneIds.Count}/{totalCount} apps processed, {lastUpdate.Count} with a public branch date, {appIds.Count} remaining.");
    await File.WriteAllTextAsync("lastupdates.json",
        JsonSerializer.Serialize(lastUpdate, new JsonSerializerOptions { WriteIndented = true })
    );
}

client.Disconnect();
running = false;

await File.WriteAllTextAsync("lastupdates.json",
    JsonSerializer.Serialize(lastUpdate, new JsonSerializerOptions { WriteIndented = true })
);
Console.WriteLine($"Saved {lastUpdate.Count} entries to lastupdates.json");

static async Task<T> Retry<T>(Func<Task<T>> action) {
    for (int attempt = 1; attempt < MaxAttempts; attempt++) {
        try {
            return await action();
        } catch (Exception) {
            await Task.Delay(TimeSpan.FromSeconds(2 * attempt));
        }
    }

    throw new Exception("Error when retrying");
}
