using System.Net;
using System.Net.Sockets;

namespace JobManagement.API.Helpers;

public static class PortUtility
{
    public static int GetAvailablePort(int preferredPort)
    {
        if (IsPortAvailable(preferredPort))
        {
            return preferredPort;
        }

        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    private static bool IsPortAvailable(int port)
    {
        try
        {
            using var listener = new TcpListener(IPAddress.Loopback, port);
            listener.Start();
            listener.Stop();
            return true;
        }
        catch (SocketException)
        {
            return false;
        }
    }
}

public record ServerPortOptions(int HttpPort);

