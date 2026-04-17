using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using System.IO;

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.Development.json")
    .Build();

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));

using var db = new ApplicationDbContext(optionsBuilder.Options);

var artworks = await db.Artworks.ToListAsync();
int updatedCount = 0;

foreach (var a in artworks)
{
    if (a.ImageUrl.Contains("127.0.0.1"))
    {
        a.ImageUrl = a.ImageUrl.Replace("127.0.0.1", "192.168.1.134");
        updatedCount++;
    }
}

if (updatedCount > 0)
{
    await db.SaveChangesAsync();
    Console.WriteLine($"Successfully updated {updatedCount} artwork URLs from 127.0.0.1 to 192.168.1.134.");
}
else
{
    Console.WriteLine("No URLs containing 127.0.0.1 were found.");
}
